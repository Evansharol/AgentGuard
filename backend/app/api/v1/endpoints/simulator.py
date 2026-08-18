from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.models.models import Execution
from app.schemas.schemas import (
    SimulatorRunRequest,
    ExecutionOut,
    RealAgentRunRequest,
    RealAgentRunResult,
)
from app.agents.simulator import AgentSimulator
from app.agents.langgraph_agent import LangGraphAgentRunner  # LangGraph-powered runner
from app.agents.real_agent import RealAgentRunner            # kept for reference

router = APIRouter()


@router.get("/scenarios")
async def list_predefined_scenarios() -> Dict[str, Any]:
    return AgentSimulator.PREDEFINED_SCENARIOS


@router.post("/run", response_model=ExecutionOut)
async def run_agent_simulation(
    req: SimulatorRunRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        execution = await AgentSimulator.run_simulation(
            session=db,
            agent_id=req.agent_id,
            scenario_key=req.scenario,
            custom_prompt=req.custom_prompt
        )
        stmt = select(Execution).where(Execution.id == execution.id).options(selectinload(Execution.steps))
        res = await db.execute(stmt)
        return res.scalar_one()
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(err)}")


@router.post("/real-run", response_model=RealAgentRunResult)
async def run_real_agent(
    req: RealAgentRunRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Run a LangGraph-powered AI agent against a task.

    The agent is implemented as a LangGraph StateGraph with three nodes:
      - reason       : calls the LLM (ChatOpenAI / GPT-4o)
      - intercept    : runs GovernanceInterceptor on every tool call BEFORE execution
      - execute_tools: executes only the tools that passed the governance check

    Conditional edges route the graph based on the governance decision:
      ALLOWED  -> execute_tools -> reason (loop)
      BLOCKED  -> END (halt, findings created, audit logged)

    Returns a full trace of ALLOWED / BLOCKED decisions for every tool call.
    """
    try:
        result = await LangGraphAgentRunner.run(
            session=db,
            agent_id=req.agent_id,
            task=req.task,
            openai_api_key=req.openai_api_key,
            file_content_b64=req.file_content_b64,
            file_name=req.file_name,
        )
        return result
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"LangGraph agent run failed: {str(err)}")

