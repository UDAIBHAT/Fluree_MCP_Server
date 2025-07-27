# Fluree MCP Server

A modern Node.js gateway that exposes [FlureeDB](https://flur.ee/) functionality through the **Model Context Protocol (MCP)**.  It combines a rich set of MCP tools, structured prompts, and session-aware routing so any LLM-powered client (IDE, chat, or custom app) can query, mutate, and manage a Fluree ledger safely and interactively.

---
## ✨ Key Features

| Category | Highlights |
|----------|------------|
| **MCP Tools** | 15+ tools: query, transact, block/block-range, history, network status, key generation, **schema management (create / update / validate / export / import)**, database diagnostics, echo |
| **Structured Prompts** | Every tool ships with a matching prompt template; clients discover via `prompts/list`, retrieve with `prompts/get`, and enjoy argument completion support |
| **Session Management** | First `initialize` call establishes a session & stores connection info (dbUrl, network, ledger) so subsequent requests are stateless for the client |
| **Validation & Safety** | All tool inputs validated with **Zod**; errors surfaced as JSON-RPC `-32602` or `-32603` |
| **Hot-Reload Friendly** | Tools & prompts registered dynamically; add new modules under `src/tools` or `src/prompts` and restart |
| **Extensible** | Written in ES Modules, small surface area—drop in new handlers, middlewares, or MCP capabilities |

---
## 🗂️ Project Structure

```
src/
 ├─ config/            # Constant defaults & env helpers
 ├─ controllers/       # MCP server controller (session init, tool/prompt registration)
 ├─ routes/            # Express routes (`/api/v1/mcp`)
 ├─ tools/             # Individual MCP tools (each default export = { name, config, handler })
 ├─ prompts/           # Prompt templates mirrored one-to-one with tools
 └─ index.js           # Express bootstrap
.env.example           # Sample environment variables
README.md              # ← you are here
```

---
## 🚀 Quick Start

1. **Clone & Install**
   ```bash
   git clone https://github.com/your-org/fluree-mcp-server.git
   cd fluree-mcp-server
   npm install
   cp .env.example .env   # adjust DB connection defaults if desired
   ```

2. **Run**
   ```bash
   npm start   # serves http://localhost:3000
   ```

3. **Initialize a Session**
   ```jsonc
   POST http://localhost:3000/api/v1/mcp
   Headers: { "Content-Type":"application/json" }
   Body:
   {
     "jsonrpc":"2.0",
     "id":1,
     "method":"initialize",
     "params":{
       "dbUrl":"Your_DBurl",
       "network":"Your_Network",
       "ledger":"Your_Ledger"
     }
   }
   ```
   The response includes `mcp-session-id`—add it to all subsequent requests.

4. **Discover Tools & Prompts**
   ```jsonc
   { "jsonrpc":"2.0", "id":2, "method":"prompts/list", "params":{} }
   ```

---
## 🖥️ IDE & Non-IDE Client Setup

**IDE clients** (Cursor, Windsurf, etc.) can add the server definition to their settings. Two examples are shown below – one for Cursor and one for Windsurf:
### CURSOR IDE
- Just insert this Patch of Json-code under the MCP-Section in the Cursor settings and you are good to go..... 
```jsonc
{
  "mcpServers": {
    "Fluree_MCP_Server": {
      "url": "http://localhost:3000/api/v1/mcp",  
      "headers": {
        "dburl": "Your_DBurl",
        "network": "Your_Network",
        "ledger": "Your_Ledger"
      }
    }
  }
}
```
### WINDSURF IDE
- Just insert this Patch of Json-code under the MCP-Section in the Windsurf Cascade settings and you are good to go.....
```jsonc
{
  "mcpServers": {
    "Fluree_MCP_Server": {
      "serverUrl": "http://localhost:3000/api/v1/mcp", 
      "headers": {
        "dbUrl": "Your_DBurl",
        "network": "Your_Network",
        "ledger": "Your_Ledger"
      }
    }
  }
}
```

**Non-IDE clients** can simply POST to `/api/v1/mcp` (or `/mcp`) with a JSON body containing `dbUrl`, `network`, and `ledger` as shown in the Quick-Start initialization request.

---

## 🔧 Tools Overview

| Name | Purpose | Input Parameters |
|------|---------|------------------|
| `flureeQueryTool` | Select data via FlureeQL | `selectFields` (array\|"*"), `fromCollection` |
| `flureeTransact` | Create random collections | `count` (1-50) |
| `flureeSchemaCreate` | Create collection + predicates | `collectionName`, `predicates[]`, `doc?` |
| `flureeSchemaUpdate` | Update collection/predicates | `collectionName`, `updateType`, etc. |
| _…_ | _See `src/tools` for the rest_ | |

Each tool handler returns `{ content:[ {type:"text"|"json", text:string|object} ] }`, ready for LLM streaming.

---
## 💬 Prompt Workflow

1. **List**  → `method:"prompts/list"`
2. **Get**   → `method:"prompts/get"`, pass prompt `name` + `arguments` object
3. **(Optional) Suggest** → `method:"completion/suggest"` for auto-complete while filling arguments

Prompts use Mustache-style placeholders (`{{argument}}`) inside user messages to instruct the assistant to call the correct tool.

---
## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `FLUREE_DB_URL` | `http://localhost:8090` | Base Fluree URL |
| `FLUREE_NETWORK` | `test` | Default network |
| `FLUREE_LEDGER` | `demo` | Default ledger |

---
## 📑 API Collection

A ready-to-import Postman collection lives at `docs/postman/Fluree_MCP.postman_collection.json` (or generate it from the sample snippet in this README).

- You can also make a new collection with specified MCP endpoint ,postman supports the mcp endpoints so just inseret the server url then it will give you the whole list of tools. 

- Just Import the collection and call the ```Initialize_req``` this will make Initialization_Connection to the MCP_Server and you can also change the ```params``` like ```dbUrl,network,ledger```
- The mcp-session-id is dynamically stored in every request through Postman Post-Req Scripts



---
## 🛣️ Roadmap / Nice-to-Haves

- JWT authentication & role-based prompt permissions
- Rate limiting & CORS controls
- WebSocket support for real-time block watch
- Production observability: Prometheus exporter & Grafana dashboard
- Docker Compose bundle (Fluree + MCP + Grafana)

---
## 📜 License

MIT © UDAI BHAT
