"""
LangGraph Agent Runner — AgentGuard.

Implements a LangGraph StateGraph that wraps the GovernanceInterceptor
as an explicit graph node. Every tool call the LLM requests must pass
through the 'intercept' node before it is allowed to reach 'execute_tools'.

Graph topology:
    [START]
       |
       v
    [reason]  ---- no tool calls --------------------------------> [END]
       |
       | tool_calls present
       v
    [intercept]  -- any BLOCKED/PENDING ------------------------> [END]
       |
       | all ALLOWED
       v
    [execute_tools]
       |
       +--------------------------------------------------------> [reason]  (loop)

Why LangGraph over a raw loop
------------------------------
- The governance boundary is an *architectural node*, not a middleware check
  buried inside a while-loop. Reviewers can read the graph and immediately
  see that every tool call must transit through `intercept`.
- Conditional edges make the ALLOWED / BLOCKED / PENDING routing explicit
  and independently testable.
- LangGraph's AgentState carries the full audit trace across all turns,
  making it trivial to surface step-by-step evidence to the frontend.
- LangGraph's interrupt_before mechanism maps natively to the
  PENDING_APPROVAL (HITL) state already modelled in AgentGuard.
"""

import json
from datetime import datetime, timezone
from typing import Any, Annotated, Dict, List, Literal, Optional, Sequence

from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)
from langchain_core.tools import tool as lc_tool
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing_extensions import TypedDict

from app.models.models import Agent, Execution
from app.governance.interceptor import GovernanceInterceptor
from app.agents.tool_registry import (
    TOOL_GOVERNANCE_METADATA,
    ToolExecutor,
    parse_uploaded_file,
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


MAX_TURNS = 10


# -----------------------------------------------------------------
# LangGraph State
# -----------------------------------------------------------------

class AgentState(TypedDict):
    """
    State that flows through every node of the AgentGuard graph.

    messages          - full conversation history (LangChain message objects).
                        The add_messages reducer merges lists instead of replacing.
    tool_call_trace   - ordered log of every tool call + governance decision.
    governance_status - overall run status: RUNNING | INTERCEPTED | COMPLETED | LIMIT_EXCEEDED
    step_number       - monotonically increasing tool-call counter.
    halt              - True when the interceptor has blocked execution and the
                        graph should terminate at the next routing decision.
    """
    messages: Annotated[Sequence[BaseMessage], add_messages]
    tool_call_trace: List[Dict[str, Any]]
    governance_status: str
    step_number: int
    halt: bool


# -----------------------------------------------------------------
# LangGraph Agent Runner
# -----------------------------------------------------------------

class LangGraphAgentRunner:
    """
    Runs an AI agent as a LangGraph StateGraph with in-line governance
    interception at every tool-call boundary.
    """

    @staticmethod
    async def run(
        session: AsyncSession,
        agent_id: str,
        task: str,
        openai_api_key: str,
        file_content_b64: Optional[str] = None,
        file_name: Optional[str] = None,
    ) -> Dict[str, Any]:

        # -- 1. Load agent + profile ------------------------------------------
        stmt = (
            select(Agent)
            .where(Agent.id == agent_id)
            .options(selectinload(Agent.profile))
        )
        result = await session.execute(stmt)
        agent = result.scalar_one_or_none()
        if not agent:
            raise ValueError(f"Agent '{agent_id}' not found.")

        profile = agent.profile
        if not profile:
            raise ValueError(f"Agent '{agent.name}' has no associated behavior profile.")

        # -- 2. Parse uploaded file -------------------------------------------
        df = None
        file_context = "No file was uploaded."
        if file_content_b64 and file_name:
            try:
                df = parse_uploaded_file(file_content_b64, file_name)
                cols = ", ".join(df.columns.tolist())
                file_context = (
                    f"The user uploaded '{file_name}' with {len(df)} rows. "
                    f"Columns: {cols}. Use 'read_excel_column' to read a column."
                )
            except Exception as exc:
                file_context = f"File upload failed: {exc}"

        executor = ToolExecutor(df=df)

        # -- 3. Create Execution record ----------------------------------------
        execution = Execution(
            agent_id=agent.id,
            status="RUNNING",
            prompt=task,
            scenario_type="LANGGRAPH_AGENT",
            total_steps=0,
            started_at=utc_now(),
        )
        session.add(execution)
        agent.total_runs_count += 1
        await session.flush()

        # -- 4. Demo mode: deterministic planned calls -------------------------
        is_demo_mode = openai_api_key.lower().strip() in [
            "demo", "mock", "demo-key", "test", ""
        ]

        if is_demo_mode:
            return await LangGraphAgentRunner._run_demo_graph(
                session=session,
                agent=agent,
                profile=profile,
                execution=execution,
                executor=executor,
                task=task,
                file_name=file_name,
                df=df,
            )

        # -- 5. Build LangChain tool wrappers ---------------------------------
        lc_tools = LangGraphAgentRunner._build_lc_tools(executor)

        # -- 6. Build LLM -----------------------------------------------------
        llm = ChatOpenAI(
            model="gpt-4o",
            api_key=openai_api_key,
            temperature=0,
        ).bind_tools(lc_tools)

        # Tool name -> callable lookup
        tool_map: Dict[str, Any] = {t.name: t for t in lc_tools}

        # -- 7. Build initial state -------------------------------------------
        system_msg = SystemMessage(content=(
            f"You are '{agent.name}', running under governance policy '{profile.name}'. "
            f"Approved tools: {profile.allowed_tools}. "
            f"Complete the task using only your available tools. {file_context}"
        ))
        initial_state: AgentState = {
            "messages": [system_msg, HumanMessage(content=task)],
            "tool_call_trace": [],
            "governance_status": "RUNNING",
            "step_number": 0,
            "halt": False,
        }

        # -- 8. Define graph nodes --------------------------------------------

        async def reason(state: AgentState) -> Dict[str, Any]:
            """Call the LLM. Returns an AIMessage (possibly with tool_calls)."""
            response: AIMessage = await llm.ainvoke(state["messages"])
            return {"messages": [response]}

        async def intercept(state: AgentState) -> Dict[str, Any]:
            """
            For every tool_call in the latest AIMessage, run the
            GovernanceInterceptor BEFORE any real execution.
            Appends governance decisions to tool_call_trace.
            Sets halt=True if any call is blocked.
            """
            last_msg: AIMessage = state["messages"][-1]
            tool_calls = getattr(last_msg, "tool_calls", []) or []

            trace = list(state["tool_call_trace"])
            step = state["step_number"]
            overall_halt = state["halt"]
            new_status = state["governance_status"]

            for tc in tool_calls:
                step += 1
                tool_name = tc["name"]
                tool_args = tc.get("args", {})
                meta = TOOL_GOVERNANCE_METADATA.get(
                    tool_name, {"data_source": "unknown", "action_type": "READ"}
                )

                intercept_status, step_result, _ = (
                    await GovernanceInterceptor.evaluate_and_intercept_step(
                        session=session,
                        agent_id=agent.id,
                        execution_id=execution.id,
                        step_number=step,
                        tool_name=tool_name,
                        data_source=meta["data_source"],
                        action_type=meta["action_type"],
                        payload=tool_args,
                    )
                )

                entry: Dict[str, Any] = {
                    "step": step,
                    "tool_name": tool_name,
                    "tool_args": tool_args,
                    "tool_call_id": tc.get("id", f"call_{step}"),
                    "decision": intercept_status,
                    "result": None,
                    "error": None,
                    "finding_id": None,
                }

                if intercept_status != "ALLOWED":
                    reasons = step_result.get("reasons", ["Policy violation"])
                    entry["error"] = reasons[0] if reasons else "Policy violation"
                    overall_halt = True
                    new_status = "INTERCEPTED"

                trace.append(entry)

            return {
                "tool_call_trace": trace,
                "step_number": step,
                "halt": overall_halt,
                "governance_status": new_status,
            }

        async def execute_tools(state: AgentState) -> Dict[str, Any]:
            """
            Execute every ALLOWED tool call and inject ToolMessage results
            back into the conversation so the LLM can continue reasoning.
            """
            last_msg: AIMessage = state["messages"][-1]
            tool_calls = getattr(last_msg, "tool_calls", []) or []
            trace = list(state["tool_call_trace"])
            tool_messages: List[ToolMessage] = []

            for tc in tool_calls:
                tool_name = tc["name"]
                tool_call_id = tc.get("id", "")

                # Find matching trace entry for this tool_call_id
                matching = [e for e in trace if e.get("tool_call_id") == tool_call_id]
                entry = matching[-1] if matching else None

                if entry and entry["decision"] == "ALLOWED":
                    raw_result = executor.execute(tool_name, tc.get("args", {}))
                    entry["result"] = raw_result
                    tool_messages.append(
                        ToolMessage(content=raw_result, tool_call_id=tool_call_id)
                    )
                else:
                    denied_msg = json.dumps({
                        "error": "PERMISSION_DENIED",
                        "tool": tool_name,
                        "message": (
                            f"Tool '{tool_name}' was blocked by the AgentGuard "
                            "governance interceptor. This tool is not permitted "
                            "under your current policy profile."
                        ),
                    })
                    tool_messages.append(
                        ToolMessage(content=denied_msg, tool_call_id=tool_call_id)
                    )

            return {"messages": tool_messages, "tool_call_trace": trace}

        # -- 9. Routing logic -------------------------------------------------

        def route_after_reason(
            state: AgentState,
        ) -> Literal["intercept", "__end__"]:
            """After the LLM responds: go to intercept if tool calls exist."""
            last = state["messages"][-1]
            tool_calls = getattr(last, "tool_calls", []) or []
            if tool_calls and state["step_number"] < MAX_TURNS:
                return "intercept"
            return "__end__"

        def route_after_intercept(
            state: AgentState,
        ) -> Literal["execute_tools", "__end__"]:
            """After interception: execute tools only if none were blocked."""
            if state["halt"]:
                return "__end__"
            return "execute_tools"

        # -- 10. Assemble StateGraph ------------------------------------------
        graph = StateGraph(AgentState)
        graph.add_node("reason", reason)
        graph.add_node("intercept", intercept)
        graph.add_node("execute_tools", execute_tools)

        graph.add_edge(START, "reason")
        graph.add_conditional_edges("reason", route_after_reason)
        graph.add_conditional_edges("intercept", route_after_intercept)
        graph.add_edge("execute_tools", "reason")   # loop back for next LLM turn

        app_graph = graph.compile()

        # -- 11. Run the graph ------------------------------------------------
        final_state: AgentState = await app_graph.ainvoke(initial_state)

        # -- 12. Extract final LLM response -----------------------------------
        final_response = "Task completed."
        for msg in reversed(final_state["messages"]):
            if isinstance(msg, AIMessage) and msg.content:
                final_response = msg.content
                break

        run_status = final_state["governance_status"]
        if run_status == "RUNNING":
            run_status = "COMPLETED"
        if final_state["step_number"] >= MAX_TURNS:
            run_status = "LIMIT_EXCEEDED"
            final_response = f"Agent reached maximum execution limit ({MAX_TURNS} turns)."

        # -- 13. Finalise execution record ------------------------------------
        trace = final_state["tool_call_trace"]
        blocked_steps = sum(1 for e in trace if e["decision"] != "ALLOWED")

        execution.total_steps = final_state["step_number"]
        execution.status = run_status
        execution.completed_at = utc_now()
        await session.commit()
        await session.refresh(execution)

        return {
            "execution_id": execution.id,
            "agent_id": agent.id,
            "agent_name": agent.name,
            "profile_name": profile.name,
            "task": task,
            "file_name": file_name,
            "final_response": final_response,
            "tool_call_trace": trace,
            "total_steps": final_state["step_number"],
            "blocked_steps": blocked_steps,
            "status": run_status,
        }

    # -----------------------------------------------------------------
    # Demo graph: same graph, deterministic planned calls
    # -----------------------------------------------------------------

    @staticmethod
    async def _run_demo_graph(
        session: AsyncSession,
        agent: Any,
        profile: Any,
        execution: Any,
        executor: ToolExecutor,
        task: str,
        file_name: Optional[str],
        df: Any,
    ) -> Dict[str, Any]:
        """
        Runs the same governance graph but with deterministic, pre-planned
        tool calls instead of live LLM inference. Zero API keys required.
        """
        lower_task = task.lower()

        col_target = "Revenue"
        if df is not None and len(df.columns) > 0:
            for c in df.columns:
                if c.lower() in lower_task:
                    col_target = c
                    break
            else:
                col_target = df.columns[-1] if len(df.columns) > 1 else df.columns[0]

        planned_calls: List[tuple] = []
        if any(kw in lower_task for kw in ["read", "calculate", "sum", "average", "avg"]):
            planned_calls.append(("read_excel_column", {"column_name": col_target}))
            if "average" in lower_task or "avg" in lower_task:
                planned_calls.append(("calculate_average", {"numbers": [15200.5, 4350.0, 28900.0]}))
            else:
                planned_calls.append(("calculate_sum", {"numbers": [15200.5, 4350.0, 28900.0]}))
        if any(kw in lower_task for kw in ["email", "send", "notify"]):
            planned_calls.append(("send_email", {"to": "manager@company.com", "subject": "Summary", "body": "Analysis complete."}))
        if any(kw in lower_task for kw in ["delete", "remove", "purge"]):
            planned_calls.append(("delete_file", {"path": file_name or "data.csv"}))
        if any(kw in lower_task for kw in ["database", "sql", "export"]):
            planned_calls.append(("query_database", {"sql": f"SELECT * FROM {file_name or 'records'}"}))
        if not planned_calls:
            planned_calls.append(("read_excel_column", {"column_name": col_target}))

        trace: List[Dict[str, Any]] = []
        step = 0
        overall_halt = False
        run_status = "RUNNING"

        for tool_name, tool_args in planned_calls:
            step += 1
            meta = TOOL_GOVERNANCE_METADATA.get(
                tool_name, {"data_source": "unknown", "action_type": "READ"}
            )
            intercept_status, step_result, _ = (
                await GovernanceInterceptor.evaluate_and_intercept_step(
                    session=session,
                    agent_id=agent.id,
                    execution_id=execution.id,
                    step_number=step,
                    tool_name=tool_name,
                    data_source=meta["data_source"],
                    action_type=meta["action_type"],
                    payload=tool_args,
                )
            )

            entry: Dict[str, Any] = {
                "step": step,
                "tool_name": tool_name,
                "tool_args": tool_args,
                "tool_call_id": f"demo_call_{step}",
                "decision": intercept_status,
                "result": None,
                "error": None,
                "finding_id": None,
            }

            if intercept_status == "ALLOWED":
                entry["result"] = executor.execute(tool_name, tool_args)
            else:
                reasons = step_result.get("reasons", ["Policy violation"])
                entry["error"] = reasons[0] if reasons else "Policy violation"
                overall_halt = True
                run_status = "INTERCEPTED"

            trace.append(entry)

            # Mirror route_after_intercept: halt immediately if blocked
            if overall_halt:
                break

        if run_status == "RUNNING":
            run_status = "COMPLETED"

        blocked = sum(1 for e in trace if e["decision"] != "ALLOWED")

        execution.total_steps = step
        execution.status = run_status
        execution.completed_at = utc_now()
        await session.commit()
        await session.refresh(execution)

        return {
            "execution_id": execution.id,
            "agent_id": agent.id,
            "agent_name": agent.name,
            "profile_name": profile.name,
            "task": task,
            "file_name": file_name,
            "final_response": (
                f"[Demo Mode — LangGraph] Processed {len(trace)} tool call(s) "
                f"through the governance graph. Policy: '{profile.name}'."
            ),
            "tool_call_trace": trace,
            "total_steps": step,
            "blocked_steps": blocked,
            "status": run_status,
        }

    # -----------------------------------------------------------------
    # Build LangChain tool wrappers from ToolExecutor
    # -----------------------------------------------------------------

    @staticmethod
    def _build_lc_tools(executor: ToolExecutor) -> List[Any]:
        """
        Wraps each ToolExecutor method as a LangChain @tool so that
        ChatOpenAI.bind_tools() can expose them to the LLM.
        """

        @lc_tool
        def read_excel_column(column_name: str) -> str:
            """Read a specific column from the uploaded CSV/Excel file."""
            return executor.execute("read_excel_column", {"column_name": column_name})

        @lc_tool
        def read_all_data() -> str:
            """Read the entire uploaded file and return all rows."""
            return executor.execute("read_all_data", {})

        @lc_tool
        def calculate_sum(numbers: List[float]) -> str:
            """Calculate the total sum of a list of numbers."""
            return executor.execute("calculate_sum", {"numbers": numbers})

        @lc_tool
        def calculate_average(numbers: List[float]) -> str:
            """Calculate the average of a list of numbers."""
            return executor.execute("calculate_average", {"numbers": numbers})

        @lc_tool
        def send_email(to: str, subject: str, body: str) -> str:
            """Send an email to a recipient with subject and body."""
            return executor.execute("send_email", {"to": to, "subject": subject, "body": body})

        @lc_tool
        def write_file(path: str, content: str) -> str:
            """Write content to a file on the filesystem."""
            return executor.execute("write_file", {"path": path, "content": content})

        @lc_tool
        def delete_file(path: str) -> str:
            """Delete a file from the filesystem."""
            return executor.execute("delete_file", {"path": path})

        @lc_tool
        def query_database(sql: str) -> str:
            """Run a SQL query against the production database."""
            return executor.execute("query_database", {"sql": sql})

        @lc_tool
        def web_search(query: str) -> str:
            """Search the internet for information."""
            return executor.execute("web_search", {"query": query})

        return [
            read_excel_column,
            read_all_data,
            calculate_sum,
            calculate_average,
            send_email,
            write_file,
            delete_file,
            query_database,
            web_search,
        ]
