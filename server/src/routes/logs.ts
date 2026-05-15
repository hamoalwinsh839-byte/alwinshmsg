import { Router } from "express";
import { db, logsTable, tasksTable } from "../db/index.js";
import { eq, inArray, desc } from "drizzle-orm";
import { requireAuth } from "./middleware.js";

const router = Router();

router.get("/logs", requireAuth, async (req, res) => {
  const tasks = await db.select({ id: tasksTable.id }).from(tasksTable).where(eq(tasksTable.userId, req.session.userId!));
  if (!tasks.length) { res.json([]); return; }
  const logs = await db.select().from(logsTable)
    .where(inArray(logsTable.taskId, tasks.map(t => t.id)))
    .orderBy(desc(logsTable.sentAt)).limit(200);
  res.json(logs);
});

export default router;
