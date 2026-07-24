"""
LLM pipeline for the Decision Engine chat.

Three thin calls over Claude (claude-opus-4-8):
  * plan()    — given the DB schema + question, decide whether it's answerable
                from the data. If yes, return ONE read-only SELECT (dialect-aware,
                joining tables as needed). If not (general knowledge, weather…),
                return kind="general".
  * present() — given the question + returned columns/rows, write a short summary
                and choose a chart (bar/line/pie/none) mapped to real columns.
  * general() — answer an off-topic question from general knowledge.

If no Anthropic credentials are configured, plan()/general() raise LLMUnavailable.
"""
import json
import os

MODEL = "claude-opus-4-8"


class LLMUnavailable(RuntimeError):
    pass


def _client():
    try:
        import anthropic
    except Exception as e:  # pragma: no cover
        raise LLMUnavailable(f"anthropic SDK not installed: {e}")
    if not (os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")):
        raise LLMUnavailable("No ANTHROPIC_API_KEY configured.")
    return anthropic.Anthropic()


def _tool_call(client, *, system, user, tool, max_tokens=1500):
    resp = client.messages.create(
        model=MODEL, max_tokens=max_tokens, thinking={"type": "adaptive"},
        system=system, tools=[tool], tool_choice={"type": "tool", "name": tool["name"]},
        messages=[{"role": "user", "content": user}],
    )
    for block in resp.content:
        if getattr(block, "type", None) == "tool_use":
            data = block.input
            return json.loads(data) if isinstance(data, str) else data
    raise LLMUnavailable("Model returned no structured result.")


PLAN_TOOL = {
    "name": "plan",
    "description": "Decide how to answer the user's question.",
    "input_schema": {
        "type": "object",
        "properties": {
            "kind": {"type": "string", "enum": ["sql", "schema", "general"],
                     "description": "sql = query row data; schema = answer about the DB structure (tables/columns) from the schema you were given; general = unrelated to the data."},
            "sql": {"type": "string", "description": "For kind=sql: a single read-only SELECT (may JOIN multiple tables)."},
            "answer": {"type": "string", "description": "For kind=schema: the answer, written directly from the schema above (e.g. list the tables/columns)."},
            "reason": {"type": "string", "description": "One short line on your choice."},
        },
        "required": ["kind"],
    },
}

PRESENT_TOOL = {
    "name": "present",
    "description": "Summarize the query result and pick a chart.",
    "input_schema": {
        "type": "object",
        "properties": {
            "summary": {"type": "string", "description": "1-3 sentence business summary of the result."},
            "chart": {
                "type": "object",
                "properties": {
                    "type": {"type": "string", "enum": ["bar", "line", "pie", "none"]},
                    "x": {"type": "string", "description": "Column for the category / x-axis (or slice labels for pie)."},
                    "y": {"type": "array", "items": {"type": "string"}, "description": "One or more numeric columns to plot."},
                    "title": {"type": "string"},
                },
                "required": ["type"],
            },
        },
        "required": ["summary", "chart"],
    },
}


def plan(schema_doc, question, dialect, prior_error=None):
    client = _client()
    system = (
        "You are a senior data analyst for MedXFlow, a healthcare revenue-cycle platform. "
        "You answer business questions by querying a connected SQL database, or — if the "
        "question is unrelated to the data — from general knowledge.\n\n"
        f"DATABASE SCHEMA ({dialect} dialect):\n{schema_doc}\n\n"
        "RULES:\n"
        "- The FULL schema is given to you above. If the user asks WHAT tables or columns exist, "
        "or to describe/list the data structure, set kind=schema and write the answer in `answer` "
        "directly from the schema above (list the table names, and columns if asked). Do NOT query "
        "information_schema / system catalogs for this.\n"
        "- If the question needs actual row data (counts, sums, lists, trends), set kind=sql and write ONE "
        f"read-only SELECT in valid {dialect} SQL. JOIN across tables when the answer spans "
        "several. Use GROUP BY / date_trunc (or the dialect equivalent) for time series like "
        "'revenue by month'. Alias aggregates with clear names. Never write to the database.\n"
        "- Some columns are JSON and list their available keys as [keys: ...]. Extract values with the "
        "dialect's JSON operators: Postgres `(col->>'key')::numeric`, MySQL `JSON_EXTRACT(col,'$.key')`, "
        "SQLite `json_extract(col,'$.key')`. e.g. revenue = SUM((input->>'charge_amount')::numeric).\n"
        "- If the question is NOT about this data (e.g. general knowledge, weather, definitions), "
        "set kind=general.\n"
        "- Prefer returning tidy, chart-friendly columns (a label/date column + numeric columns)."
    )
    user = f"Question: {question}"
    if prior_error:
        user += f"\n\nYour previous SQL failed with: {prior_error}\nWrite a corrected single SELECT."
    return _tool_call(client, system=system, user=user, tool=PLAN_TOOL)


def present(question, columns, rows):
    client = _client()
    sample = rows[:60]
    system = (
        "You summarize a SQL query result for a business user. Be concise and concrete "
        "(cite the key numbers). Then choose a chart: use 'line' for time series, 'bar' for "
        "category comparisons, 'pie' for parts-of-a-whole (<=8 slices), or 'none' if a chart "
        "wouldn't help (single value, or free-form rows). x and y MUST be column names from the "
        "result; y columns must be numeric."
    )
    user = (f"Question: {question}\n\nColumns: {columns}\n\n"
            f"Rows ({len(rows)} total, showing {len(sample)}):\n{json.dumps(sample, default=str)}")
    return _tool_call(client, system=system, user=user, tool=PRESENT_TOOL)


def general(question):
    client = _client()
    resp = client.messages.create(
        model=MODEL, max_tokens=1200, thinking={"type": "adaptive"},
        system=("You are the MedXFlow Decision Engine assistant. The user asked something not "
                "answerable from their connected database, so answer from general knowledge. "
                "Be helpful and concise, and note that this wasn't from their data."),
        messages=[{"role": "user", "content": question}],
    )
    return "".join(b.text for b in resp.content if getattr(b, "type", None) == "text").strip()
