import { Router } from "express";
import { db, tokensTable, tasksTable, logsTable } from "../db/index.js";
import { eq, inArray, count, sql } from "drizzle-orm";
import { requireAuth } from "./middleware.js";

const router = Router();

router.get("/stats", requireAuth, async (req, res) => {
  const uid = req.session.userId!;
  const [ts] = await db.select({
    total: count(),
    active: sql<number>`sum(case when ${tokensTable.status}='active' then 1 else 0 end)`,
  }).from(tokensTable).where(eq(tokensTable.userId, uid));

  const [tk] = await db.select({
    total: count(),
    active: sql<number>`sum(case when ${tasksTable.isActive}=true then 1 else 0 end)`,
  }).from(tasksTable).where(eq(tasksTable.userId, uid));

  const tasks = await db.select({ id: tasksTable.id }).from(tasksTable).where(eq(tasksTable.userId, uid));
  let totalSent = 0, successRate = 0;
  if (tasks.length) {
    const [ls] = await db.select({
      total: count(),
      success: sql<number>`sum(case when ${logsTable.status}='success' then 1 else 0 end)`,
    }).from(logsTable).where(inArray(logsTable.taskId, tasks.map(t => t.id)));
    totalSent = Number(ls?.total ?? 0);
    successRate = totalSent > 0 ? (Number(ls?.success ?? 0) / totalSent) * 100 : 0;
  }

  res.json({
    totalTokens: Number(ts?.total ?? 0),
    activeTokens: Number(ts?.active ?? 0),
    totalTasks: Number(tk?.total ?? 0),
    activeTasks: Number(tk?.active ?? 0),
    totalSent, successRate,
  });
});

export default router;
