from typing import Dict, Any, List, Optional, Tuple

class GovernanceDetector:
    """
    Evaluates agent runtime activity against its approved behaviour profile.
    Identifies unauthorized tool usage, unauthorized data source access,
    unauthorized action types, and threshold/budget guardrail warning zones.
    """

    @staticmethod
    def evaluate_step(
        profile: Any,
        agent: Any,
        tool_name: str,
        data_source: str,
        action_type: str,
        payload: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        deviations = []

        # 1. Check Agent Status
        if agent.status == "BLOCKED":
            deviations.append({
                "severity": "CRITICAL",
                "deviation_type": "AGENT_IS_BLOCKED",
                "title": "Blocked Agent Execution Attempt",
                "description": f"Agent {agent.name} is currently BLOCKED but attempted to execute tool '{tool_name}'.",
                "expected": {"agent_status": "ACTIVE"},
                "observed": {"agent_status": "BLOCKED", "attempted_tool": tool_name},
                "response_action": "AUTO_BLOCK"
            })
            return deviations

        if agent.status == "PENDING_APPROVAL":
            deviations.append({
                "severity": "HIGH",
                "deviation_type": "PENDING_APPROVAL_FREEZE",
                "title": "Execution Blocked Pending Governance Approval",
                "description": f"Agent {agent.name} is currently frozen awaiting human review.",
                "expected": {"agent_status": "ACTIVE"},
                "observed": {"agent_status": "PENDING_APPROVAL", "attempted_tool": tool_name},
                "response_action": "REQUIRE_APPROVAL"
            })
            return deviations

        # 2. Check Allowed Tools
        allowed_tools = profile.allowed_tools or []
        if tool_name not in allowed_tools:
            # Check if it's a catastrophic action like file_delete, sql_drop, system_exec
            is_catastrophic = any(kw in tool_name.lower() for kw in ["delete", "drop", "destroy", "system", "cmd", "admin", "exec"])
            severity = "CRITICAL" if is_catastrophic else "HIGH"
            response_action = "AUTO_BLOCK" if is_catastrophic else "REQUIRE_APPROVAL"
            
            deviations.append({
                "severity": severity,
                "deviation_type": "UNAUTHORIZED_TOOL",
                "title": f"Unauthorized Tool Invocation: '{tool_name}'",
                "description": f"Agent invoked tool '{tool_name}', which is absent from sanctioned profile '{profile.name}'.",
                "expected": {"allowed_tools": allowed_tools},
                "observed": {"invoked_tool": tool_name, "payload": payload},
                "response_action": response_action
            })

        # 3. Check Allowed Data Sources
        allowed_data_sources = profile.allowed_data_sources or []
        if data_source not in allowed_data_sources:
            is_restricted_db = any(kw in data_source.lower() for kw in ["financial", "ssn", "credit", "secret", "master", "admin", "prod"])
            severity = "CRITICAL" if is_restricted_db else "HIGH"
            response_action = "AUTO_BLOCK" if is_restricted_db else "REQUIRE_APPROVAL"

            deviations.append({
                "severity": severity,
                "deviation_type": "UNAUTHORIZED_DATA_SOURCE",
                "title": f"Unauthorized Data Source Access: '{data_source}'",
                "description": f"Agent attempted to access data source '{data_source}', which is outside approved boundaries.",
                "expected": {"allowed_data_sources": allowed_data_sources},
                "observed": {"accessed_data_source": data_source},
                "response_action": response_action
            })

        # 4. Check Allowed Actions (Verbs)
        allowed_actions = profile.allowed_actions or []
        if action_type.upper() not in [a.upper() for a in allowed_actions]:
            is_destructive = action_type.upper() in ["DELETE", "DROP", "EXECUTE", "PURGE"]
            severity = "CRITICAL" if is_destructive else "HIGH"
            response_action = "AUTO_BLOCK" if is_destructive else "REQUIRE_APPROVAL"

            deviations.append({
                "severity": severity,
                "deviation_type": "UNAUTHORIZED_ACTION",
                "title": f"Unauthorized Action Verb: '{action_type}'",
                "description": f"Agent attempted action verb '{action_type}', which exceeds approved actions scope.",
                "expected": {"allowed_actions": allowed_actions},
                "observed": {"attempted_action": action_type},
                "response_action": response_action
            })

        # 5. Check Financial & Custom Parameter Limits
        if "amount" in payload:
            raw_amount = payload.get("amount")
            try:
                if isinstance(raw_amount, str):
                    clean_str = raw_amount.replace("$", "").replace(",", "").strip()
                    amount = float(clean_str)
                else:
                    amount = float(raw_amount)

                if amount > profile.max_financial_limit:
                    deviations.append({
                        "severity": "HIGH",
                        "deviation_type": "PARAMETER_VIOLATION",
                        "title": f"Financial Limit Exceeded: ${amount:,.2f} (Max ${profile.max_financial_limit:,.2f})",
                        "description": f"Action parameter amount ${amount:,.2f} exceeds approved maximum threshold of ${profile.max_financial_limit:,.2f}.",
                        "expected": {"max_financial_limit": profile.max_financial_limit},
                        "observed": {"requested_amount": amount},
                        "response_action": "REQUIRE_APPROVAL"
                    })
            except (ValueError, TypeError):
                deviations.append({
                    "severity": "HIGH",
                    "deviation_type": "PARAMETER_VIOLATION",
                    "title": f"Invalid Financial Parameter Format: '{raw_amount}'",
                    "description": f"Action parameter amount '{raw_amount}' is not a valid numeric value.",
                    "expected": {"max_financial_limit": profile.max_financial_limit, "type": "number"},
                    "observed": {"requested_amount": raw_amount},
                    "response_action": "REQUIRE_APPROVAL"
                })

        # 6. Check Usage Guardrails & Threshold Warning Zones (80%, 90%, 100%)
        projected_calls = agent.daily_calls_count + 1
        max_calls = max(1, profile.max_calls_per_day)
        usage_pct = (projected_calls / max_calls) * 100.0

        if usage_pct >= 100.0:
            deviations.append({
                "severity": "CRITICAL",
                "deviation_type": "GUARDRAIL_LIMIT_EXCEEDED",
                "title": f"Daily Call Budget Exceeded (100% Limit: {projected_calls}/{max_calls})",
                "description": f"Agent reached {usage_pct:.1f}% of daily allocated execution budget ({max_calls} calls). Execution blocked.",
                "expected": {"max_calls_per_day": max_calls},
                "observed": {"current_calls": projected_calls, "usage_percentage": usage_pct},
                "response_action": "AUTO_BLOCK"
            })
        elif usage_pct >= profile.critical_threshold_pct:
            deviations.append({
                "severity": "HIGH",
                "deviation_type": "GUARDRAIL_WARN_90",
                "title": f"Critical Usage Warning ({usage_pct:.1f}% of Daily Budget)",
                "description": f"Agent call usage reached critical threshold zone ({projected_calls}/{max_calls} calls).",
                "expected": {"critical_threshold_pct": profile.critical_threshold_pct},
                "observed": {"current_calls": projected_calls, "usage_percentage": usage_pct},
                "response_action": "REQUIRE_APPROVAL"
            })
        elif usage_pct >= profile.warning_threshold_pct:
            deviations.append({
                "severity": "LOW",
                "deviation_type": "GUARDRAIL_WARN_80",
                "title": f"Warning Zone Reached ({usage_pct:.1f}% of Daily Budget)",
                "description": f"Agent has consumed {usage_pct:.1f}% of daily call quota ({projected_calls}/{max_calls} calls). Notification sent.",
                "expected": {"warning_threshold_pct": profile.warning_threshold_pct},
                "observed": {"current_calls": projected_calls, "usage_percentage": usage_pct},
                "response_action": "NOTIFY"
            })

        return deviations
