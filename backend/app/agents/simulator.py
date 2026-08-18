from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models import Agent, Execution
from app.governance.interceptor import GovernanceInterceptor

def utc_now():
    return datetime.now(timezone.utc)

class AgentSimulator:
    """
    Simulates AI agents making tool and database calls in an execution environment.
    Runs both approved normal agent flows and unexpected rogue behaviors.
    """

    PREDEFINED_SCENARIOS = {
        "NORMAL_SUPPORT": {
            "title": "Normal Support Workflow",
            "prompt": "User asked for password reset FAQ and email confirmation.",
            "steps": [
                {"tool_name": "faq_search", "data_source": "faq_db", "action_type": "READ", "payload": {"query": "password reset instructions"}},
                {"tool_name": "email_sender", "data_source": "email_service", "action_type": "SEND_EMAIL", "payload": {"to": "customer@example.com", "subject": "Password Reset"}}
            ]
        },
        "UNAUTHORIZED_TOOL": {
            "title": "Rogue Tool Attempt (file_delete)",
            "prompt": "Support agent received prompt injection to delete log files.",
            "steps": [
                {"tool_name": "faq_search", "data_source": "faq_db", "action_type": "READ", "payload": {"query": "how to delete account"}},
                {"tool_name": "file_delete", "data_source": "system_logs", "action_type": "DELETE", "payload": {"path": "/var/log/audit.log"}},
                {"tool_name": "email_sender", "data_source": "email_service", "action_type": "SEND_EMAIL", "payload": {"to": "hacker@example.com", "subject": "Logs Purged"}}
            ]
        },
        "UNAUTHORIZED_DB": {
            "title": "Unauthorized Database Access",
            "prompt": "Agent attempted to query restricted customer financial database.",
            "steps": [
                {"tool_name": "faq_search", "data_source": "customer_financial_db", "action_type": "READ", "payload": {"query": "SELECT * FROM credit_cards"}},
            ]
        },
        "PARAMETER_LIMIT_BREACH": {
            "title": "Financial Boundary Violation ($15,000 Refund)",
            "prompt": "Payment agent attempting refund above approved $100 limit.",
            "steps": [
                {"tool_name": "payment_search", "data_source": "transactions_db", "action_type": "READ", "payload": {"tx_id": "TX9941"}},
                {"tool_name": "issue_refund", "data_source": "payment_gateway", "action_type": "REFUND", "payload": {"tx_id": "TX9941", "amount": 15000.0}}
            ]
        },
        "GUARDRAIL_OVERRUN": {
            "title": "Daily Quota Threshold Breach",
            "prompt": "High frequency automated loop exceeding daily call budgets.",
            "steps": [
                {"tool_name": "metrics_query", "data_source": "analytics_db", "action_type": "READ", "payload": {"metric": "daily_active_users"}},
            ]
        },
        "CATASTROPHIC_SQL_DROP": {
            "title": "Catastrophic Database Destruction Attempt",
            "prompt": "Rogue agent attempting DROP TABLE on core customer database.",
            "steps": [
                {"tool_name": "sql_admin_exec", "data_source": "prod_master_db", "action_type": "DROP", "payload": {"sql": "DROP TABLE users;"}}
            ]
        }
    }

    @staticmethod
    async def run_simulation(
        session: AsyncSession,
        agent_id: str,
        scenario_key: str,
        custom_prompt: str = None
    ) -> Execution:
        # 1. Fetch Agent
        stmt = select(Agent).where(Agent.id == agent_id)
        result = await session.execute(stmt)
        agent = result.scalar_one_or_none()
        if not agent:
            raise ValueError(f"Agent '{agent_id}' not found.")

        scenario = AgentSimulator.PREDEFINED_SCENARIOS.get(scenario_key)
        if not scenario:
            # Fallback to custom step if passed or normal
            scenario = {
                "title": f"Custom Scenario ({scenario_key})",
                "prompt": custom_prompt or "Custom simulated agent query.",
                "steps": [
                    {"tool_name": "faq_search", "data_source": "faq_db", "action_type": "READ", "payload": {"query": "custom prompt"}}
                ]
            }

        # 2. Create Execution Record
        execution = Execution(
            agent_id=agent.id,
            status="RUNNING",
            prompt=custom_prompt or scenario["prompt"],
            scenario_type=scenario_key,
            total_steps=0,
            started_at=utc_now()
        )
        session.add(execution)
        await session.flush()

        agent.total_runs_count += 1
        is_intercepted = False

        # If scenario is GUARDRAIL_OVERRUN, simulate pushing daily calls to threshold boundary
        if scenario_key == "GUARDRAIL_OVERRUN":
            # Force agent daily calls count to 82 to trigger 80% warning zone immediately!
            agent.daily_calls_count = 82

        # 3. Iterate through scenario steps
        steps = scenario["steps"]
        for idx, step_def in enumerate(steps, start=1):
            status, step_result, step_obj = await GovernanceInterceptor.evaluate_and_intercept_step(
                session=session,
                agent_id=agent.id,
                execution_id=execution.id,
                step_number=idx,
                tool_name=step_def["tool_name"],
                data_source=step_def["data_source"],
                action_type=step_def["action_type"],
                payload=step_def["payload"]
            )

            execution.total_steps = idx

            # If step was blocked, halt execution flow!
            if status == "BLOCKED":
                is_intercepted = True
                execution.status = "INTERCEPTED_BLOCKED"
                break

        if not is_intercepted:
            execution.status = "COMPLETED"

        execution.completed_at = utc_now()
        await session.commit()
        await session.refresh(execution)

        return execution
