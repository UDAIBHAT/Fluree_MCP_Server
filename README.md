# MCP Fluree Server

## Session Initialization Requirements

When starting a new session (first POST to `/mcp` without a session ID), you must provide the following Fluree DB connection parameters in the request body:

- `dbUrl`: The base URL of the Fluree node 
- `network`: The Fluree network name 
- `ledger`: The Fluree ledger name

Example initialization payload:

```json
{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": {
    "dbUrl": "http://localhost:8090",
    "network": "xyz",
    "ledger": "abc"
  },
  "id": 1
}
```

### Fallback to Environment Variables

If any of these parameters are not provided, the server will use the following environment variables (or their defaults):

- `FLUREE_DB_URL` 
- `FLUREE_NETWORK`
- `FLUREE_LEDGER`

You can set these in a `.env` file or your environment.

## For IDE and Non-IDE Clients

- **IDE clients**: Should send these parameters as part of the session initialization payload.
```json
{
  "mcpServers": {
    "Fluree_MCP_Server": {
      "url": "http://localhost:3000/mcp",
      "headers": {
        "dbUrl": "http://localhost:8090",  // for cursor
        "network": "ssbd",
        "ledger": "amc"
      }
    }
  }
}
```
- **Non-IDE clients**: Can POST to `/mcp` with a JSON body containing `dbUrl`, `network`, and `ledger`.

## Tool Usage

All Fluree-related tools will use the session's connection info for database operations. No URLs are hardcoded in the tool implementations. 