"""
Real Agent Runner — AgentGuard.

Runs a real OpenAI GPT-4o tool-calling loop.
Before every tool execution, the GovernanceInterceptor
evaluates whether the tool call is allowed under the agent's policy.

Flow:
  1. Send task + tool definitions to OpenAI
  2. OpenAI responds with one or more tool_calls
  3. For each tool_call:
       a. GovernanceInterceptor checks against agent's profile
       b. If ALLOWED  → execute the real tool, send result back to OpenAI
       c. If BLOCKED  → send "permission denied" back to OpenAI, halt if critical
  4. Repeat until OpenAI produces a final text response
  5. Return full trace + final answer
"""

import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from openai import OpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.models import Agent, Execution
from app.governance.interceptor import GovernanceInterceptor
from app.agents.tool_registry import (
    TOOL_SCHEMAS,
    TOOL_GOVERNANCE_METADATA,
    ToolExecutor,
    parse_uploaded_file,
)


def utc_now():
    return datetime.now(timezone.utc)


# How many LLM turns we allow before stopping (prevents runaway loops)
MAX_TURNS = 10


class RealAgentRunner:
    """
    Runs a real LLM agent with live governance interception.
    Every tool call is checked against the agent's policy before execution.
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
        # ── 1. Load agent + profile ──────────────────────────
        stmt = select(Agent).where(Agent.id == agent_id).options(selectinload(Agent.profile))
        result = await session.execute(stmt)
        agent = result.scalar_one_or_none()
        if not agent:
            raise ValueError(f"Agent '{agent_id}' not found.")

        profile = agent.profile
        if not profile:
            raise ValueError(f"Agent '{agent.name}' has no associated behavior profile.")

        # ── 2. Parse uploaded file (if any) ──────────────────
        df = None
        file_context = "No file was uploaded."
        if file_content_b64 and file_name:
            try:
                df = parse_uploaded_file(file_content_b64, file_name)
                cols = ", ".join(df.columns.tolist())
                file_context = (
                    f"The user has uploaded a file named '{file_name}'. "
                    f"It has {len(df)} rows and the following columns: {cols}. "
                    f"Use 'read_excel_column' to read a specific column."
                )
            except Exception as e:
                file_context = f"File upload failed to parse: {str(e)}"

        executor = ToolExecutor(df=df)

        # ── 3. Create Execution record ────────────────────────
        execution = Execution(
            agent_id=agent.id,
            status="RUNNING",
            prompt=task,
            scenario_type="REAL_AGENT",
            total_steps=0,
            started_at=utc_now(),
        )
        session.add(execution)
        agent.total_runs_count += 1
        await session.flush()

        # ── 4. Build conversation messages ───────────────────
        system_prompt = (
            f"You are '{agent.name}', an AI agent running under strict governance policy: '{profile.name}'. "
            f"Your approved tools are: {profile.allowed_tools}. "
            f"Complete the user's task using only the tools available to you. "
            f"{file_context}"
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": task},
        ]

        # ── 5. Tool-calling loop (Live OpenAI or Demo Mode) ──────────────
        is_demo_mode = openai_api_key.lower().strip() in ["demo", "mock", "demo-key", "test", ""]
        tool_call_trace: List[Dict[str, Any]] = []
        step_number = 0
        final_response = None
        run_status = "COMPLETED"

        if is_demo_mode:
            # Generate simulated LLM tool calls dynamically based on task and file columns
            planned_calls = []
            lower_task = task.lower()

            # Find matching column
            col_target = "Revenue"
            if df is not None and len(df.columns) > 0:
                for c in df.columns:
                    if c.lower() in lower_task:
                        col_target = c
                        break
                else:
                    # Pick first numeric or first column
                    col_target = df.columns[-1] if len(df.columns) > 1 else df.columns[0]

            if "read" in lower_task or "calculate" in lower_task or "sum" in lower_task or "average" in lower_task:
                planned_calls.append(("read_excel_column", {"column_name": col_target}))
                if "average" in lower_task or "avg" in lower_task:
                    planned_calls.append(("calculate_average", {"numbers": [15200.5, 4350.0, 28900.0, 9800.25, 12400.0, 3100.0, 45000.0, 18750.75]}))
                else:
                    planned_calls.append(("calculate_sum", {"numbers": [15200.5, 4350.0, 28900.0, 9800.25, 12400.0, 3100.0, 45000.0, 18750.75]}))

            if "email" in lower_task or "send" in lower_task or "notify" in lower_task:
                planned_calls.append(("send_email", {"to": "manager@company.com", "subject": "Summary Report", "body": "Analysis report attached."}))

            if "delete" in lower_task or "remove" in lower_task or "purge" in lower_task:
                planned_calls.append(("delete_file", {"path": file_name or "uploaded_data.csv"}))

            if "database" in lower_task or "sql" in lower_task or "export" in lower_task:
                planned_calls.append(("query_database", {"sql": f"SELECT * FROM {file_name or 'records'}"}))

            if not planned_calls:
                planned_calls.append(("read_excel_column", {"column_name": col_target}))

            for tool_name, tool_args in planned_calls:
                step_number += 1
                meta = TOOL_GOVERNANCE_METADATA.get(tool_name, {"data_source": "unknown", "action_type": "READ"})
                intercept_status, step_result, _ = await GovernanceInterceptor.evaluate_and_intercept_step(
                    session=session,
                    agent_id=agent.id,
                    execution_id=execution.id,
                    step_number=step_number,
                    tool_name=tool_name,
                    data_source=meta["data_source"],
                    action_type=meta["action_type"],
                    payload=tool_args,
                )
                if intercept_status == "ALLOWED":
                    tool_output = executor.execute(tool_name, tool_args)
                    tool_call_trace.append({
                        "step": step_number,
                        "tool_name": tool_name,
                        "tool_args": tool_args,
                        "decision": "ALLOWED",
                        "result": tool_output,
                        "finding_id": None,
                    })
                else:
                    reasons = step_result.get("reasons", ["Policy violation"])
                    tool_call_trace.append({
                        "step": step_number,
                        "tool_name": tool_name,
                        "tool_args": tool_args,
                        "decision": "BLOCKED",
                        "result": None,
                        "error": reasons[0] if reasons else "Policy violation",
                        "finding_id": None,
                    })
                    run_status = "INTERCEPTED"

            final_response = f"[Demo Mode] Processed {len(planned_calls)} tool calls. Decisions evaluated against policy '{profile.name}'."

        else:
            # Live OpenAI execution
            client = OpenAI(api_key=openai_api_key)
            for _turn in range(MAX_TURNS):
                response = client.chat.completions.create(
                    model="gpt-4o",
                    messages=messages,
                    tools=TOOL_SCHEMAS,
                    tool_choice="auto",
                )

                choice = response.choices[0]
                msg = choice.message

                if choice.finish_reason == "stop" or not msg.tool_calls:
                    final_response = msg.content or "Task completed."
                    break

                messages.append(msg)

                for tool_call in msg.tool_calls:
                    step_number += 1
                    tool_name = tool_call.function.name
                    try:
                        tool_args = json.loads(tool_call.function.arguments)
                    except json.JSONDecodeError:
                        tool_args = {}

                    meta = TOOL_GOVERNANCE_METADATA.get(
                        tool_name,
                        {"data_source": "unknown", "action_type": "READ"}
                    )

                    intercept_status, step_result, _step_obj = (
                        await GovernanceInterceptor.evaluate_and_intercept_step(
                            session=session,
                            agent_id=agent.id,
                            execution_id=execution.id,
                            step_number=step_number,
                            tool_name=tool_name,
                            data_source=meta["data_source"],
                            action_type=meta["action_type"],
                            payload=tool_args,
                        )
                    )

                    if intercept_status == "ALLOWED":
                        tool_output = executor.execute(tool_name, tool_args)
                        trace_entry = {
                            "step": step_number,
                            "tool_name": tool_name,
                            "tool_args": tool_args,
                            "decision": "ALLOWED",
                            "result": tool_output,
                            "finding_id": None,
                        }
                    else:
                        reasons = step_result.get("reasons", ["Policy violation"])
                        tool_output = json.dumps({
                            "error": "PERMISSION_DENIED",
                            "reasons": reasons,
                            "message": (
                                f"Tool '{tool_name}' is not permitted under your current policy profile. "
                                f"Violation: {', '.join(reasons)}"
                            ),
                        })
                        trace_entry = {
                            "step": step_number,
                            "tool_name": tool_name,
                            "tool_args": tool_args,
                            "decision": "BLOCKED",
                            "result": None,
                            "error": reasons[0] if reasons else "Policy violation",
                            "finding_id": None,
                        }
                        run_status = "INTERCEPTED"

                    tool_call_trace.append(trace_entry)
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": tool_output,
                    })

            if final_response is None:
                final_response = f"Agent reached the maximum execution limit ({MAX_TURNS} turns)."
                run_status = "LIMIT_EXCEEDED"

        # ── 6. Finalize execution record ─────────────────────
        execution.total_steps = step_number
        execution.status = run_status
        execution.completed_at = utc_now()
        await session.commit()
        await session.refresh(execution)

        blocked_steps = sum(1 for t in tool_call_trace if t["decision"] == "BLOCKED")

        return {
            "execution_id": execution.id,
            "agent_id": agent.id,
            "agent_name": agent.name,
            "profile_name": profile.name,
            "task": task,
            "file_name": file_name,
            "final_response": final_response,
            "tool_call_trace": tool_call_trace,
            "total_steps": step_number,
            "blocked_steps": blocked_steps,
            "status": run_status,
        }
