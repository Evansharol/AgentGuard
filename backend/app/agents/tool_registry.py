"""
Tool Registry for AgentGuard Real Agent Mode.

Defines all tools available to the LLM agent, their OpenAI function schemas,
their actual implementations, and metadata used by the GovernanceInterceptor
(data_source, action_type).
"""

import io
import json
from typing import Any, Dict, List, Optional

import pandas as pd

# ─────────────────────────────────────────────
# Tool metadata — used by the interceptor
# to decide data_source and action_type
# ─────────────────────────────────────────────
TOOL_GOVERNANCE_METADATA: Dict[str, Dict[str, str]] = {
    "read_excel_column":  {"data_source": "uploaded_file",  "action_type": "READ"},
    "read_all_data":      {"data_source": "uploaded_file",  "action_type": "READ"},
    "calculate_sum":      {"data_source": "local_compute",  "action_type": "READ"},
    "calculate_average":  {"data_source": "local_compute",  "action_type": "READ"},
    "send_email":         {"data_source": "email_service",  "action_type": "SEND_EMAIL"},
    "write_file":         {"data_source": "filesystem",     "action_type": "WRITE"},
    "delete_file":        {"data_source": "filesystem",     "action_type": "DELETE"},
    "query_database":     {"data_source": "prod_database",  "action_type": "READ"},
    "web_search":         {"data_source": "internet",       "action_type": "READ"},
}


# ─────────────────────────────────────────────
# OpenAI tool schemas (function definitions)
# ─────────────────────────────────────────────
TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "read_excel_column",
            "description": "Read a specific column from the uploaded Excel or CSV file. Returns the values as a list.",
            "parameters": {
                "type": "object",
                "properties": {
                    "column_name": {
                        "type": "string",
                        "description": "The exact name of the column header to read (e.g. 'Revenue', 'Sales', 'Name')"
                    }
                },
                "required": ["column_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_all_data",
            "description": "Read the entire uploaded file and return all rows and columns as a table.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_sum",
            "description": "Calculate the total sum of a list of numbers.",
            "parameters": {
                "type": "object",
                "properties": {
                    "numbers": {
                        "type": "array",
                        "items": {"type": "number"},
                        "description": "List of numbers to sum"
                    }
                },
                "required": ["numbers"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_average",
            "description": "Calculate the average of a list of numbers.",
            "parameters": {
                "type": "object",
                "properties": {
                    "numbers": {
                        "type": "array",
                        "items": {"type": "number"},
                        "description": "List of numbers to average"
                    }
                },
                "required": ["numbers"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "send_email",
            "description": "Send an email with the given subject and body to a recipient.",
            "parameters": {
                "type": "object",
                "properties": {
                    "to": {"type": "string", "description": "Recipient email address"},
                    "subject": {"type": "string", "description": "Email subject line"},
                    "body": {"type": "string", "description": "Email body content"}
                },
                "required": ["to", "subject", "body"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Write content to a file on the filesystem.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "File path to write to"},
                    "content": {"type": "string", "description": "Content to write"}
                },
                "required": ["path", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_file",
            "description": "Delete a file from the filesystem.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "File path to delete"}
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "query_database",
            "description": "Run a SQL query against the production database.",
            "parameters": {
                "type": "object",
                "properties": {
                    "sql": {"type": "string", "description": "SQL query string to execute"}
                },
                "required": ["sql"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the internet for information.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"}
                },
                "required": ["query"]
            }
        }
    },
]


# ─────────────────────────────────────────────
# Actual tool implementations
# df is the parsed DataFrame from the uploaded file
# ─────────────────────────────────────────────

class ToolExecutor:
    def __init__(self, df: Optional[pd.DataFrame] = None):
        # The uploaded file, parsed into a DataFrame
        self.df = df

    def execute(self, tool_name: str, args: Dict[str, Any]) -> str:
        """Dispatch and execute a tool, returning a string result."""
        method = getattr(self, f"_tool_{tool_name}", None)
        if method is None:
            return f"[ERROR] Unknown tool: {tool_name}"
        try:
            return method(**args)
        except Exception as e:
            return f"[ERROR] Tool '{tool_name}' failed: {str(e)}"

    def _tool_read_excel_column(self, column_name: str) -> str:
        if self.df is None:
            return "[ERROR] No file uploaded. Please upload a CSV or Excel file first."
        # Case-insensitive column match
        matched = [c for c in self.df.columns if c.strip().lower() == column_name.strip().lower()]
        if not matched:
            available = ", ".join(self.df.columns.tolist())
            return f"[ERROR] Column '{column_name}' not found. Available columns: {available}"
        col = matched[0]
        values = self.df[col].dropna().tolist()
        return json.dumps({"column": col, "values": values, "count": len(values)})

    def _tool_read_all_data(self) -> str:
        if self.df is None:
            return "[ERROR] No file uploaded."
        # Return first 20 rows to avoid huge payloads
        preview = self.df.head(20).to_dict(orient="records")
        return json.dumps({
            "columns": self.df.columns.tolist(),
            "rows": preview,
            "total_rows": len(self.df)
        })

    def _tool_calculate_sum(self, numbers: List[float]) -> str:
        total = sum(float(n) for n in numbers if n is not None)
        return json.dumps({"sum": total, "count": len(numbers)})

    def _tool_calculate_average(self, numbers: List[float]) -> str:
        clean = [float(n) for n in numbers if n is not None]
        if not clean:
            return json.dumps({"average": 0, "count": 0})
        avg = sum(clean) / len(clean)
        return json.dumps({"average": round(avg, 4), "count": len(clean)})

    def _tool_send_email(self, to: str, subject: str, body: str) -> str:
        # Simulated — does NOT actually send email
        return json.dumps({
            "status": "simulated_sent",
            "to": to,
            "subject": subject,
            "note": "Email send is simulated (no real SMTP configured)."
        })

    def _tool_write_file(self, path: str, content: str) -> str:
        # Simulated — does NOT actually write to disk
        return json.dumps({
            "status": "simulated_write",
            "path": path,
            "bytes_written": len(content),
            "note": "File write is simulated for safety."
        })

    def _tool_delete_file(self, path: str) -> str:
        # Simulated — does NOT actually delete anything
        return json.dumps({
            "status": "simulated_delete",
            "path": path,
            "note": "File delete is simulated for safety."
        })

    def _tool_query_database(self, sql: str) -> str:
        # Simulated — does NOT run against real DB
        return json.dumps({
            "status": "simulated_query",
            "sql": sql,
            "rows": [{"id": 1, "value": "mock_row_1"}, {"id": 2, "value": "mock_row_2"}],
            "note": "Database query is simulated."
        })

    def _tool_web_search(self, query: str) -> str:
        # Simulated — returns mock results
        return json.dumps({
            "status": "simulated_search",
            "query": query,
            "results": [
                {"title": f"Result 1 for '{query}'", "url": "https://example.com/1"},
                {"title": f"Result 2 for '{query}'", "url": "https://example.com/2"},
            ],
            "note": "Web search is simulated."
        })


def parse_uploaded_file(file_content_b64: str, file_name: str) -> pd.DataFrame:
    """Parse a base64-encoded CSV or Excel file into a DataFrame."""
    import base64
    raw = base64.b64decode(file_content_b64)
    buf = io.BytesIO(raw)
    if file_name.lower().endswith((".xlsx", ".xls")):
        return pd.read_excel(buf)
    else:
        # Try comma first, then semicolon
        try:
            return pd.read_csv(buf)
        except Exception:
            buf.seek(0)
            return pd.read_csv(buf, sep=";")
