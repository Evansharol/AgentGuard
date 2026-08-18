from datetime import datetime, timezone
from typing import Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.models import Agent, Execution, ExecutionStep, AuditLog
from app.governance.detector import GovernanceDetector
from app.governance.response_engine import ResponseEngine

def utc_now():
    return datetime.now(timezone.utc)

class GovernanceInterceptor:
    """
    Central Runtime Intelligence Interceptor for AgentGuard.
    Intercepts every agent tool/data action in real-time before execution,
    compares against approved Profile baseline, detects deviations, triggers response actions,
    and returns explicit ALLOWED or BLOCKED decision.
    """

    @staticmethod
    async def evaluate_and_intercept_step(
        session: AsyncSession,
        agent_id: str,
        execution_id: str,
        step_number: int,
        tool_name: str,
        data_source: str,
        action_type: str,
        payload: Dict[str, Any]
    ) -> Tuple[str, Dict[str, Any], ExecutionStep]:
        # 1. Fetch Agent with Profile loaded
        stmt = select(Agent).where(Agent.id == agent_id).options(selectinload(Agent.profile))
        result = await session.execute(stmt)
        agent = result.scalar_one_or_none()

        if not agent:
            raise ValueError(f"Agent '{agent_id}' not found.")

        profile = agent.profile
        if not profile:
            raise ValueError(f"Agent '{agent.name}' has no associated behavior profile.")

        # 2. Run Anomaly & Guardrail Detector
        deviations = GovernanceDetector.evaluate_step(
            profile=profile,
            agent=agent,
            tool_name=tool_name,
            data_source=data_source,
            action_type=action_type,
            payload=payload
        )

        # 3. Process Response Actions via ResponseEngine
        if deviations:
            resp_result = await ResponseEngine.process_deviations(
                session=session,
                agent=agent,
                execution_id=execution_id,
                deviations=deviations
            )
            step_status = "BLOCKED" if resp_result["status"] in ["BLOCKED", "PENDING_APPROVAL"] else "WARNING"
        else:
            step_status = "ALLOWED"

        # 4. Increment daily call count & last active time
        agent.daily_calls_count += 1
        agent.last_active_at = utc_now()

        # 5. Build Step Result
        if step_status == "ALLOWED":
            step_result = {
                "decision": "ALLOWED",
                "message": f"Tool '{tool_name}' and Action '{action_type}' successfully verified against baseline profile '{profile.name}'.",
                "execution_output": f"Executed {tool_name} on {data_source} successfully."
            }
        else:
            dev_titles = [d["title"] for d in deviations]
            step_result = {
                "decision": "BLOCKED",
                "message": f"GOVERNANCE VIOLATION INTERCEPTED: Execution halted.",
                "reasons": dev_titles,
                "remediation": "Review finding in Governance Dashboard Approval Queue."
            }

        # 6. Record ExecutionStep
        step = ExecutionStep(
            execution_id=execution_id,
            step_number=step_number,
            tool_name=tool_name,
            data_source=data_source,
            action_type=action_type,
            payload=payload,
            result=step_result,
            status=step_status
        )
        session.add(step)
        
        # Audit record for the evaluation
        audit = AuditLog(
            event_type="STEP_INTERCEPTED",
            agent_id=agent.id,
            actor="INTERCEPTOR_ENGINE",
            details={
                "step_number": step_number,
                "tool_name": tool_name,
                "data_source": data_source,
                "action_type": action_type,
                "decision": step_status,
                "violations_count": len(deviations)
            }
        )
        session.add(audit)

        await session.commit()
        return step_status, step_result, step
