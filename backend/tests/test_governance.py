import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.database import engine, Base, AsyncSessionLocal
from app.db.seed import seed_initial_data
from sqlalchemy import select
from app.models.models import Agent

@pytest_asyncio.fixture(autouse=True)
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as session:
        await seed_initial_data(session)
    yield

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/")
        assert res.status_code == 200
        assert res.json()["status"] == "online"

@pytest.mark.asyncio
async def test_analytics_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/analytics/")
        assert res.status_code == 200
        data = res.json()
        assert "total_agents" in data
        assert "overall_compliance_score_pct" in data

@pytest.mark.asyncio
async def test_list_agents():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/agents/")
        assert res.status_code == 200
        agents = res.json()
        assert len(agents) >= 3

@pytest.mark.asyncio
async def test_normal_simulation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "agent_id": "agent-support-01",
            "scenario": "NORMAL_SUPPORT"
        }
        res = await ac.post("/api/v1/simulator/run", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "COMPLETED"
        assert len(data["steps"]) == 2
        for step in data["steps"]:
            assert step["status"] == "ALLOWED"

@pytest.mark.asyncio
async def test_unauthorized_tool_simulation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "agent_id": "agent-support-01",
            "scenario": "UNAUTHORIZED_TOOL"
        }
        res = await ac.post("/api/v1/simulator/run", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "INTERCEPTED_BLOCKED"

        # Check findings created
        find_res = await ac.get("/api/v1/findings/?agent_id=agent-support-01")
        assert find_res.status_code == 200
        findings = find_res.json()
        assert len(findings) > 0


@pytest.mark.asyncio
async def test_langgraph_real_agent_demo_run():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "agent_id": "agent-file-analyst-01",
            "task": "Read Revenue and send an email report to manager",
            "openai_api_key": "demo"
        }
        res = await ac.post("/api/v1/simulator/real-run", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] in ["COMPLETED", "INTERCEPTED"]
        assert len(data["tool_call_trace"]) > 0
        trace_tools = [t["tool_name"] for t in data["tool_call_trace"]]
        assert "read_excel_column" in trace_tools


@pytest.mark.asyncio
async def test_parameter_limit_breach():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "agent_id": "agent-payment-01",
            "scenario": "PARAMETER_LIMIT_BREACH"
        }
        res = await ac.post("/api/v1/simulator/run", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "INTERCEPTED_BLOCKED"


@pytest.mark.asyncio
async def test_guardrail_budget_threshold():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "agent_id": "agent-analytics-01",
            "scenario": "GUARDRAIL_OVERRUN"
        }
        res = await ac.post("/api/v1/simulator/run", json=payload)
        assert res.status_code == 200


