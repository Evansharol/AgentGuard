# Project Brief: FLYYY.AI Agent Governance

## Problem Statement
As enterprises adopt AI agents to interact with business systems, a core governance challenge emerges: ensuring AI agents operate strictly within their approved boundaries. It is not enough to prompt an agent not to do something; organizations must continuously understand whether its actual behavior remains within approved limits, detect deviations, and enforce controls deterministically.

## The Challenge
Build an AI Agent Governance application that can define, monitor, detect, and respond to agent behavior that falls outside its approved profile.

## Core Objectives
1. **Define (Agent Behaviour Profile):** Create explicit boundaries detailing allowed tools, data sources, and actions.
2. **Detect (Agent Deviations):** Compare actual agent activity against its profile at runtime. Identify and record unauthorized tool usage or data access.
3. **Warn (Guardrails):** Implement configurable warning thresholds (e.g., 80% usage limits) to catch issues before hard limits are breached.
4. **Respond & Enforce:** Trigger appropriate responses (Notify → Require Approval → Block) based on the severity of the deviation.
5. **Audit Trail:** Maintain an immutable record of all executions, deviations, responses, and human ratification decisions.

## Evaluation Criteria
- Depth of problem understanding and system design.
- Clear separation between the probabilistic AI agent and the deterministic governance layer.
- Clean engineering, accurate detection, and effective enforcement handling.
