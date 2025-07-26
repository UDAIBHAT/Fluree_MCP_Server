import { Router } from "express";
import { Initializer, handleSessionRequest } from "../controllers/Initializer.controller.js";
const router = Router()

router
.route('/mcp')
.post(Initializer)
.get(handleSessionRequest)
.delete(handleSessionRequest);

export default router;