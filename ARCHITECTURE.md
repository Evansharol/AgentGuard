# Architecture: AI Agent Governance Platform

This document outlines the core architecture of the AI Agent Governance platform. The primary goal is to ensure deterministic enforcement over probabilistic agent behavior.

## Design Principles
1. **Deterministic Enforcement:** AI agents powered by LLMs are probabilistic. The governance layer (detection, evaluation, and enforcement) MUST be deterministic and strictly separated from the agent's logic.
2. **Explicit Approval (Human-in-the-Loop):** Any deviation that doesn't immediately warrant a hard block requires explicit human ratification before proceeding.
3. **Immutable Audit:** Every action (automated or human-initiated) must be logged permanently.

## System Layers

### 1. Deterministic Governance Layer (The Sentinel)
This layer acts as the firewall between the agent and the tools/data it attempts to access.
- **Agent Behaviour Profile:** Defines exactly what the agent is authorized to do (see `AGENTS.md`).
- **Deviation Detector:** Intercepts agent tool calls. If an unauthorized tool is invoked, it generates a "Finding".
- **Enforcement Engine:** Evaluates the severity of the deviation based on guardrail thresholds (e.g., 80% limit warning, 100% hard block) and triggers the appropriate response flow (Notify -> Require Approval -> Block).

### 2. The Agent Environment (Simulation Layer)
This is a mock environment demonstrating an AI agent in action.
- Built using an agent framework (e.g., LangGraph or LangChain).
- Demonstrates normal operation (accessing allowed tools).
- Simulates anomalous behavior (attempting to use unauthorized tools or databases) to trigger the governance layer.

### 3. Ratification & Audit (The Web Dashboard)
- **Inbox/Verdicts:** A UI for administrators to review blocked or paused actions. Shows exactly what the agent attempted vs. what its profile allowed.
- **Audit Trail:** An append-only log of every single tool execution, deviation, warning, block, and human approval.

## Technology Stack
- **Backend:** Python / FastAPI
- **Frontend:** React.js / Next.js
- **Database:** PostgreSQL (with SQLite fallback for local dev)
- **Agent Framework:** LangGraph / LangChain

## Sequence Flow
1. Agent generates a plan and attempts a `Tool Call`.
2. The Request is routed through the **Governance Layer**.
3. The Governance Layer checks the **Agent Behaviour Profile**.
   - If Valid: Tool executes.
   - If Invalid (Deviation): The execution is paused or blocked. A `Finding` is created.
4. The system determines the severity of the Finding.
5. High-severity actions require a human admin to visit the Web Dashboard to Approve or Reject the action.
6. The entire sequence is recorded in the Audit Log.
