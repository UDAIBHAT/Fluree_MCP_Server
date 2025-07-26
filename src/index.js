import express from "express";
import morgan from "morgan";
import * as config from "./config/constant.js";


const app = express();
app.use(morgan('dev'));
app.use(express.json());

// MCP Routes
import mcproutes from "./routes/mcp.routes.js"

app.use("api/v1/",mcproutes);


app.listen(config.Port, () => {
  console.log(`MCP Stateful Streamable HTTP Server listening on port ${config.Port}`);
});
