from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import Profile, Agent, AuditLog

async def seed_initial_data(session: AsyncSession):
    # 1. Profiles definitions
    profiles_to_seed = [
        Profile(
            id="prof-support-01",
            name="Customer Support Profile",
            description="Standard guardrails for customer-facing support AI agents. Allows KB lookups and email responses.",
            allowed_tools=["faq_search", "email_sender", "order_status_check"],
            allowed_data_sources=["faq_db", "kb_articles", "order_catalog", "email_service"],
            allowed_actions=["READ", "SEND_EMAIL"],
            max_calls_per_day=100,
            max_tokens_per_run=4000,
            max_financial_limit=50.0,
            warning_threshold_pct=80.0,
            critical_threshold_pct=90.0
        ),
        Profile(
            id="prof-payment-01",
            name="Payment & Refund Support Profile",
            description="Guardrails for financial support agents. Restricts refund amount to $100 maximum.",
            allowed_tools=["payment_search", "issue_refund", "send_receipt", "transaction_lookup"],
            allowed_data_sources=["transactions_db", "payment_gateway", "customer_orders", "email_service"],
            allowed_actions=["READ", "REFUND", "SEND_EMAIL"],
            max_calls_per_day=250,
            max_tokens_per_run=8000,
            max_financial_limit=100.0,
            warning_threshold_pct=80.0,
            critical_threshold_pct=90.0
        ),
        Profile(
            id="prof-analyst-01",
            name="Enterprise Data Analyst Profile",
            description="Read-only analytical querying guardrails. Strictly prohibits write, update, delete, or external export.",
            allowed_tools=["metrics_query", "chart_generator", "report_exporter"],
            allowed_data_sources=["analytics_db", "warehouse_marts", "kpi_dashboards"],
            allowed_actions=["READ", "EXPORT"],
            max_calls_per_day=500,
            max_tokens_per_run=16000,
            max_financial_limit=0.0,
            warning_threshold_pct=80.0,
            critical_threshold_pct=90.0
        ),
        Profile(
            id="prof-file-analyst-01",
            name="File Analyst Profile",
            description="Restricted profile for file analysis tasks. Can only read a specific column and compute basic stats. Cannot send emails, delete files, or access databases.",
            allowed_tools=["read_excel_column", "calculate_sum", "calculate_average"],
            allowed_data_sources=["uploaded_file", "local_compute"],
            allowed_actions=["READ"],
            max_calls_per_day=200,
            max_tokens_per_run=8000,
            max_financial_limit=0.0,
            warning_threshold_pct=80.0,
            critical_threshold_pct=90.0
        )
    ]

    for prof in profiles_to_seed:
        stmt = select(Profile).where(Profile.id == prof.id)
        res = await session.execute(stmt)
        if not res.scalar_one_or_none():
            session.add(prof)

    await session.flush()

    # 2. Agents definitions
    agents_to_seed = [
        Agent(
            id="agent-file-analyst-01",
            name="File Analyst Bot",
            role="Data File Analyst",
            status="ACTIVE",
            profile_id="prof-file-analyst-01",
            owner_email="analyst@agentguard.dev",
            total_runs_count=0,
            daily_calls_count=0
        ),
        Agent(
            id="agent-support-01",
            name="Tier-1 Support Bot",
            role="Customer Support Assistant",
            status="ACTIVE",
            profile_id="prof-support-01",
            owner_email="support-lead@agentguard.dev",
            total_runs_count=12,
            daily_calls_count=18
        ),
        Agent(
            id="agent-payment-01",
            name="Payment Disputes Handler",
            role="Billing & Refund Specialist",
            status="ACTIVE",
            profile_id="prof-payment-01",
            owner_email="finance-ops@agentguard.dev",
            total_runs_count=34,
            daily_calls_count=42
        ),
        Agent(
            id="agent-analytics-01",
            name="Executive KPI Analyst",
            role="BI & Metrics Intelligence",
            status="ACTIVE",
            profile_id="prof-analyst-01",
            owner_email="data-team@agentguard.dev",
            total_runs_count=89,
            daily_calls_count=78
        )
    ]

    for ag in agents_to_seed:
        stmt = select(Agent).where(Agent.id == ag.id)
        res = await session.execute(stmt)
        if not res.scalar_one_or_none():
            session.add(ag)

    await session.commit()

