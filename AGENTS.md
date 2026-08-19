# Agent Behaviour Profiles

This document defines the schema and expected structure for Agent Behaviour Profiles. A profile acts as the deterministic baseline against which actual agent activity is evaluated.

## Core Schema
An agent profile defines boundaries across three primary dimensions:

### 1. Allowed Tools
The explicit list of functions, APIs, or tools the agent is permitted to invoke.
- `FAQ Search`
- `Email Sender`
- *Unauthorized tools like `file-delete` or `db-drop` will trigger an immediate deviation.*

### 2. Allowed Data
The boundaries on which databases, collections, or data sources the agent can read from or write to.
- `FAQ Database`
- `Public Documentation`
- *Unauthorized data like `customer-PII-database` will trigger a deviation.*

### 3. Allowed Actions
The types of operations the agent can perform. This maps to CRUD-style permissions or explicit business logic actions.
- `Read`
- `Send Email`
- *Unauthorized actions like `Write`, `Delete`, or `Modify` will trigger a deviation.*

## Guardrails and Thresholds
Profiles can also define continuous boundaries (guardrails) that warn before a hard limit is breached.

**Example Thresholds:**
- Model Calls Limit: `1,000 / day`
  - Warning Threshold: `80% (800 calls)`
  - Critical Threshold: `90% (900 calls)`
  - Block Threshold: `100% (1000 calls)`

## Enforcement Actions
When a profile is violated, the system triggers a configured response:
- **Notify:** Low severity, admin is alerted but execution continues.
- **Require Approval:** Medium severity, agent is paused until admin ratifies the action.
- **Block:** High severity, agent execution is killed and the action is rejected.

*Note: The exact profile structure in code is represented as a JSON schema or a SQLAlchemy Model within the governance layer.*
