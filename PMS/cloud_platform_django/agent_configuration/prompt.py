def prompt(data):
    prompt_parts = []

    def add_section(title, value):
        if value:
            prompt_parts.append(
                f"{title}\n"
                f"{'=' * 79}\n"
                f"{value}\n"
            )

    add_section("Agent Name", data.get("agent_name"))
    add_section("Agent Description", data.get("agent_description"))
    add_section("Role", data.get("role"))
    add_section("Few Shot Example", data.get("few_shot"))
    add_section("Task", data.get("task"))
    add_section("Rules", data.get("rules"))
    add_section("Context", data.get("context"))
    add_section("Test-Console Input", data.get("test_console_input"))


    # Special case: files (no text value)
    if data.get("files"):
        prompt_parts.append(
            "Files\n"
            + "=" * 79 + "\n"
            + "User uploaded files are attached.\n"
        )

    return "\n".join(prompt_parts)
