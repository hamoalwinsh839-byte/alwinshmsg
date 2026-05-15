import { db, tasksTable, tokensTable } from "./db/index.js";
import { eq, and, lte } from "drizzle-orm";
import { logsTable } from "./db/index.js";
import { sendDiscordMessage } from "./routes/tasks.js";

export function startScheduler() {
  setInterval(async () => {
    try {
      const now = new Date();
      const due = await db.select().from(tasksTable)
        .where(and(eq(tasksTable.isActive, true), lte(tasksTable.nextRunAt, now)));
      for (const task of due) {
        try {
          const [token] = await db.select().from(tokensTable).where(eq(tokensTable.id, task.tokenId));
          if (!token || token.status === "invalid") continue;
          const result = await sendDiscordMessage(token.tokenValue, task.channelId, task.message, task.imagePath);
          await db.insert(logsTable).values({
            taskId: task.id, channelId: task.channelId,
            status: result.success ? "success" : "failed", errorMessage: result.error || null,
          });
          const nextRunAt = task.intervalSeconds ? new Date(Date.now() + task.intervalSeconds * 1000) : null;
          await db.update(tasksTable).set({ sentCount: task.sentCount + 1, nextRunAt }).where(eq(tasksTable.id, task.id));
        } catch (err) {
          console.error(`Scheduler error for task ${task.id}:`, err);
        }
      }
    } catch (err) {
      console.error("Scheduler error:", err);
    }
  }, 5000);
  console.log("⏰ Scheduler started (every 5s)");
}
