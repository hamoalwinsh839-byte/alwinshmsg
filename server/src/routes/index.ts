import { Router } from "express";
import authRouter from "./auth.js";
import tokensRouter from "./tokens.js";
import tasksRouter from "./tasks.js";
import logsRouter from "./logs.js";
import statsRouter from "./stats.js";
import uploadRouter from "./upload.js";

const router = Router();
router.get("/healthz", (_req, res) => res.json({ status: "ok" }));
router.use(authRouter);
router.use(tokensRouter);
router.use(tasksRouter);
router.use(logsRouter);
router.use(statsRouter);
router.use(uploadRouter);

export default router;
