# Builtin Tools for Casibase

This package provides battery-included tools that can be enabled directly in the store configuration without requiring MCP server setup.

## Available Tools

### Time Tool
- **Name**: `current_time`
- **Description**: Get the current time in a specific timezone and format
- **Status**: ✅ Implemented
- **Parameters**:
  - `timezone` (optional): Timezone name (e.g., "UTC", "America/New_York", "Asia/Shanghai"). Default: "UTC"
  - `format` (optional): Time format in Go time layout (e.g., "2006-01-02 15:04:05"). Default: "2006-01-02 15:04:05"

**Example Usage by AI**:
```json
{
  "timezone": "Asia/Shanghai",
  "format": "2006-01-02 15:04:05"
}
```

### Code Execution Tool
- **Name**: `execute_code`
- **Description**: Execute code in a sandboxed environment
- **Status**: 🚧 Placeholder - Not yet implemented
- **Parameters**:
  - `code`: The code to execute
  - `language`: Programming language (e.g., "python", "javascript"). Default: "python"

### JSON Processing Tool
- **Name**: `process_json`
- **Description**: Process and manipulate JSON data
- **Status**: 🚧 Placeholder - Not yet implemented
- **Parameters**:
  - `json_data`: JSON data to process
  - `operation`: Operation to perform (e.g., "parse", "format", "query"). Default: "parse"

## How to Enable Builtin Tools

### In the UI

1. Navigate to the Store configuration page
2. Find the "Builtin tools" section (after Agent provider)
3. Check the boxes for the tools you want to enable:
   - ☐ Time tool
   - ☐ Code execution tool (Placeholder)
   - ☐ JSON processing tool (Placeholder)
4. Save the store configuration

### Backend Implementation

The builtin tools are integrated with the existing agent system and work alongside MCP tools:

1. **Store Configuration**: The `Store` struct has a new `BuiltinTools` field (string array) that stores enabled tool names
2. **Tool Loading**: Tools are defined in YAML files under `tools/<tool_name>/<tool_name>.yaml`
3. **Tool Execution**: When a tool is called, `ExecuteBuiltinTool()` routes to the appropriate handler
4. **Integration**: Builtin tools are merged with MCP tools in `GetAgentClientsWithBuiltinTools()`

### Adding New Builtin Tools

To add a new builtin tool:

1. Create a directory: `tools/<tool_name>/`
2. Create a YAML definition: `tools/<tool_name>/<tool_name>.yaml`
   ```yaml
   name: your_tool_name
   description: What your tool does
   inputSchema:
     type: object
     properties:
       param1:
         type: string
         description: Parameter description
     required: []
   ```
3. Add the tool name to `availableTools` in `tools/tools.go`
4. Implement the tool execution in `tools/executor.go`:
   ```go
   func ExecuteYourTool(arguments string) (string, error) {
       // Implementation here
   }
   ```
5. Add the tool to the routing in `ExecuteBuiltinTool()`
6. Update the frontend in `web/src/StoreEditPage.js` to add a checkbox
7. Add i18n translations for all 9 languages

## Architecture

```
┌─────────────────┐
│  Store Config   │
│  builtinTools:  │
│  ["time"]       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ GetAgentClientsWithBuiltin  │
│ Tools()                     │
│  - Loads MCP tools          │
│  - Loads builtin tools      │
│  - Merges both              │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  QueryTextWithTools()       │
│  - Detects builtin vs MCP   │
│  - Routes to appropriate    │
│    handler                  │
└────────┬────────────────────┘
         │
         ├─────────────────┐
         ▼                 ▼
┌──────────────┐   ┌──────────────┐
│ MCP Client   │   │ ExecuteBuil  │
│ CallTool()   │   │ tinTool()    │
└──────────────┘   └──────────────┘
```

## Testing

Run tests for the tools package:

```bash
cd tools
go test -v
```

All tests should pass:
- TestExecuteTimeTool
- TestExecuteTimeToolWithTimezone
- TestLoadToolConfig
- TestGetEnabledTools
- TestExecuteBuiltinTool
