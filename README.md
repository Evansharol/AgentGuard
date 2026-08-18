# AgentGuard — Real-Time AI Agent Policy Enforcer & Governance Engine

> An in-line runtime security firewall and governance engine for autonomous AI agents. Intercepts tool calls, verifies behavioral boundaries, halts unauthorized actions, enforces tiered warning zones, and manages human-in-the-loop approvals.

---

## 💡 Executive Summary & Problem Understanding

Autonomous AI agents (powered by LLMs, LangChain, or custom tool loops) are fundamentally different from traditional deterministic software. Traditional software executes predefined code paths. An AI agent translates **unstructured data and runtime prompts directly into real system side-effects**—invoking tools, querying databases, reading files, and calling external APIs.

This introduces the **Execution Boundary Problem**:
1. **Static Analysis & Code Scanners Fail**: The agent's application code contains no malware or CVEs. The vulnerability is emergent: a poisoned document or prompt injection coerces the agent into misusing legitimate tools in unexpected ways.
2. **Post-Hoc Logs Are Too Late**: Alerting via log ingestion minutes after an agent executes a `DROP TABLE`, accesses customer credentials, or exfiltrates records means the damage has already occurred.
3. **Siloed Visibility**: Traditional tools flag isolated anomalies without understanding the agent's intent or policy constraints.

### The Solution: In-Line Runtime Interception
**AgentGuard** acts as an **in-line security proxy and policy enforcer** positioned directly at the execution boundary between the AI agent's decision engine and external tools. Every tool call is intercepted, checked against the agent's approved behavioral profile, and evaluated against configurable guardrail thresholds **before execution is permitted**.

---

## ⚙️ Architecture & Governance Lifecycle

```
                               +------------------------------------------------+
                               |     User Task / Input Data (Files, Prompts)    |
                               +-----------------------+------------------------+
                                                       |
                                                       v
+--------------------------------------------------------------------------------------------------------+
|                                        AGENTGUARD ENGINE                                               |
|                                                                                                        |
|  1. AI AGENT REASONING LAYER (GPT-4o / LangChain / Simulated Execution)                                |
|     Agent decides to invoke a tool with specific parameters (e.g. read_excel_column, query_database)    |
|                                                       |                                                |
|                                                       v                                                |
|  2. RUNTIME INTERCEPTOR (interceptor.py)                                                               |
|     Intercepts tool invocation payload BEFORE any real-world side effect occurs                        |
|                                                       |                                                |
|                                                       v                                                |
|  3. POLICY & DEVIATION DETECTOR (detector.py)                                                          |
|     Evaluates action against the Agent's Sanctioned Profile:                                           |
|     ├── Whitelisted Tools (e.g. ['faq_search', 'email_sender'])                                        |
|     ├── Permitted Data Sources (e.g. ['faq_database'], blocking sensitive DBs)                         |
|     ├── Authorized Action Verbs (READ vs WRITE vs DELETE vs DROP)                                      |
|     ├── Parameter & Financial Limits (e.g. max $100 per transaction)                                   |
|     └── Call Budget & Guardrails (Warning Zones at 80%, 90%, 100%)                                     |
|                                                       |                                                |
|                                                       v                                                |
|  4. TIERED RESPONSE ESCALATION (response_engine.py)                                                    |
|     ├── ALLOWED (Green)     ──> Execute tool & return result to agent loop                             |
|     ├── NOTIFY (80% Zone)   ──> Log warning, notify admin, allow execution                             |
|     ├── APPROVAL (90% Zone) ──> Freeze agent, generate Finding, dispatch to HITL Queue                 |
|     └── AUTO_BLOCK (100% /) ──> Immediately halt execution, suspend agent, log incident               |
|                                                       |                                                |
|                                                       v                                                |
|  5. IMMUTABLE AUDIT TRAIL & FORENSICS (audit_trail.py / SQLite / PostgreSQL)                           |
|     Records exact evidence: Who, What, Expected vs Observed, Decision, and Timestamp                  |
+--------------------------------------------------------------------------------------------------------+
```

---

## 🔬 Threat Model & The 5-Stage Agent Escape Anatomy

Research into AI agent security and runtime escapes reveals a predictable multi-stage progression:

| Stage | Vector / Attacker Objective | Traditional Tool Blindspot | AgentGuard Runtime Enforcement |
| :--- | :--- | :--- | :--- |
| **1. Malicious Input** | Indirect Prompt Injection / Poisoned File payload | No malware or CVE; text appears benign | Intercepts downstream tool deviation immediately when agent attempts out-of-scope actions. |
| **2. Reconnaissance & Misuse** | Probing unauthorized tables, cloud metadata (`169.254.169.254`), or secret tokens | Agent has general network/read permissions | Enforces strict **Data Source Whitelisting**; blocks access to restricted databases and paths. |
| **3. Privilege Escalation** | Invoking destructive verbs (`DELETE`, `DROP`, `EXEC`) | Syscalls / command strings invisible to log tools | Enforces **Action Verb Profiles**; auto-blocks destructive verbs and suspends the agent. |
| **4. Boundary Breach** | Calling unauthorized system utilities or external services | Appears as normal internal HTTP / tool traffic | Enforces **Tool Whitelisting**; halts unapproved tool calls before network/OS dispatch. |
| **5. Exfiltration / Overuse** | Resource exhaustion or excessive financial transactions | Volume blips dismissed as normal load | Enforces **Configurable Guardrail Thresholds (80%, 90%, 100%)** and monetary limits. |

---

## 🚀 Key Features

1. **Deterministic Behavioral Profiles**:
   - Define exact allowed tools, data sources, and action verbs (`READ`, `WRITE`, `DELETE`, `REFUND`).
   - Associate profiles with specific agents across different operational roles (Support, Financial, Analyst).

2. **Configurable Warning Zones & Thresholds**:
   - **80% Usage**: Non-blocking **Warning Notification** sent to governance logs.
   - **90% Usage**: **Critical Warning Zone** — agent execution is frozen and routed for human approval.
   - **100% Limit**: **Auto-Block** — agent execution is terminated to prevent budget or rate overrun.

3. **Structured Finding & Evidence Generation**:
   - Every deviation produces a rich forensic record capturing:
     - Deviating Agent Name & ID
     - Expected Behavior vs. Observed Behavior
     - Offending Tool, Data Source, or Action Verb
     - Execution Timestamp and Run ID

4. **Human-in-the-Loop (HITL) Governance Queue**:
   - High-severity violations and critical warning zones freeze the agent in a `PENDING_APPROVAL` state.
   - Governance officers can inspect the forensic diff (*Expected vs Observed*) and click **Approve** (resumes agent) or **Reject** (terminates and keeps blocked).

5. **LangGraph-Powered Dual-Mode Execution**:
   - **Live Mode**: A LangGraph `StateGraph` drives a real GPT-4o agent. Three nodes — `reason`, `intercept`, `execute_tools` — with conditional edges enforcing governance at every tool-call boundary. File ingestion (CSV/Excel) supported.
   - **Demo Mode**: Same LangGraph graph, deterministic planned tool calls — zero API keys required. Instantly demonstrates the full interception flow.

6. **Immutable Audit Trail**:
   - Complete historical ledger recording all deviations, approvals, rejections, blocks, and resumes.

---

## 🛠️ Tech Stack & Project Structure

* **Agent Framework**: **LangGraph** (`StateGraph`) orchestrates the real agent loop. The governance interceptor is an explicit graph node with conditional edges that route execution based on policy decisions (ALLOWED → continue, BLOCKED → halt).
* **LLM**: `langchain-openai` (`ChatOpenAI` / GPT-4o) with `.bind_tools()` for structured tool calling.
* **Backend**: Python 3.11+, FastAPI, SQLAlchemy Async, SQLite (or PostgreSQL via `DATABASE_URL`), Pydantic v2, OpenAI SDK, Pandas, OpenPyXL.
* **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Axios.

```
flyyai/
├── backend/
│   ├── app/
│   │   ├── agents/            # Live LLM runner, simulated agent, tool registry
│   │   ├── api/               # FastAPI route endpoints (agents, profiles, findings, approvals)
│   │   ├── core/              # Config and database sessions
│   │   ├── governance/        # Interceptor, Policy Detector, Response Escalation Engine
│   │   ├── models/            # SQLAlchemy database models
│   │   └── schemas/           # Pydantic schemas and validation
│   ├── requirements.txt
│   └── seed_data.py           # Preloaded profiles, agents, and test scenarios
├── frontend/
│   ├── src/
│   │   ├── components/        # Dashboard, Simulator, ApprovalQueue, FindingsHub, Fleet, Profiles
│   │   ├── services/          # Typed API client
│   │   └── types/             # TypeScript data definitions
│   └── package.json
├── sales_data_q3.csv          # Sample dataset for file analysis testing
├── employee_payroll.csv       # Sensitive sample dataset for data breach testing
└── README.md
```

---

## 🏃 Quick Start

### 1. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python seed_data.py
python -m uvicorn app.main:app --port 8000 --reload
```
* API Server: `http://localhost:8000`
* Interactive API Docs (Swagger): `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
* Web Dashboard: `http://localhost:5173`

---

## 🧪 Testing the Governance Scenarios

### Method 1: Pre-Configured Test Scenarios (Instant Demo)
Navigate to **Test Lab** $\rightarrow$ **Pre-configured Test Scenarios**:

1. **Normal Safe Execution**:
   - Agent: *Customer Support Agent*
   - Tools: `faq_search`, `email_sender` $\rightarrow$ **ALLOWED ✅**
2. **Rogue Tool Deviation**:
   - Agent: *Customer Support Agent*
   - Attempted Action: `file_delete` (unapproved tool) $\rightarrow$ **BLOCKED 🚫** (Finding created)
3. **Unauthorized Data Source Breach**:
   - Agent: *Payment Support Agent*
   - Attempted Action: Queries `customer_financial_db` $\rightarrow$ **BLOCKED 🚫** (Finding created)
4. **Parameter Limit & Financial Guardrail**:
   - Agent: *Refund Bot*
   - Attempted Action: Requests \$15,000 refund (Profile max is \$100) $\rightarrow$ **FROZEN FOR APPROVAL ⏳**
5. **Destructive SQL Action**:
   - Agent: *Database Assistant*
   - Attempted Action: `DROP TABLE users` $\rightarrow$ **AUTO-BLOCKED & AGENT SUSPENDED 🚫**

### Method 2: Real LLM Agent with File Upload
1. In the **Test Lab**, switch to **Real LLM Agent (Live OpenAI & File Upload)**.
2. Upload `sales_data_q3.csv`.
3. Select **File Analyst Bot** (approved only for reading columns and computing stats).
4. Enter `demo` in the API Key field (or paste a valid OpenAI key).
5. Prompt: *"Read the Revenue column and email the summary to manager@corp.com"*.
6. **Watch the live interception trace**: Column reading and stats calculation succeed ✅, but `send_email` is intercepted and blocked 🚫 because the profile restricts email capabilities.

---

## ⚖️ Technical Trade-offs & Architecture Decisions

| Decision | Approach Chosen | Rationale & Trade-off |
| :--- | :--- | :--- |
| **Interception Point** | In-Line Application Proxy | **Chosen**: Evaluates tool calls before execution. **Trade-off**: Minimal latency overhead per tool call (~2–5ms), but prevents damage before it occurs. |
| **Policy Model** | Explicit Whitelist (Negative by Default) | **Chosen**: Any tool, data source, or action verb not explicitly in the profile is denied. **Trade-off**: Requires explicit profiling, but eliminates false negatives. |
| **Response Model** | Tiered Severity Escalation | **Chosen**: Low severity $\rightarrow$ Notify; Medium/High $\rightarrow$ HITL Freeze; Critical $\rightarrow$ Immediate Auto-Block. Prevents alert fatigue while securing critical assets. |
| **Persistence** | Async SQLAlchemy + RDBMS | **Chosen**: Compatible with SQLite for zero-config local testing and PostgreSQL for enterprise production. |

---

## 🔮 Scope, Limitations & Future Work

* **Application vs. System Boundary**: AgentGuard enforces governance at the application and tool layer. In large enterprise production environments, this can be combined with infrastructure-level runtime monitors (e.g., eBPF-based kernel telemetry) for defense-in-depth against host-level exploits.
* **Semantic Policy Intent**: Future iterations can incorporate secondary lightweight LLM evaluators to detect subtle semantic drift in tool input arguments before dispatch.

---

## 🛡️ License
MIT License.
