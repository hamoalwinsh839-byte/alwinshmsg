import { Router } from "express";
import { db, tasksTable, tokensTable, logsTable } from "../db/index.js";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "./middleware.js";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = path.join(__dirname, "..", "..", "uploads");

const router = Router();

router.get("/tasks", requireAuth, async (req, res) => {
  const tasks = await db.select().from(tasksTable).where(eq(tasksTable.userId, req.session.userId!));
  res.json(tasks);
});

router.post("/tasks", requireAuth, async (req, res) => {
  const { tokenId, channelId, message, serverId, imagePath, scheduleTime, intervalSeconds } = req.body;
  if (!tokenId || !channelId || !message) {
    res.status(400).json({ message: "tokenId, channelId, message required" }); return;
  }
  const nextRunAt = intervalSeconds ? new Date(Date.now() + Number(intervalSeconds) * 1000) : null;
  const [task] = await db.insert(tasksTable).values({
    userId: req.session.userId!, tokenId: Number(tokenId),
    channelId, message, serverId: serverId || null, imagePath: imagePath || null,
    scheduleTime: scheduleTime || "0 * * * *",
    intervalSeconds: intervalSeconds ? Number(intervalSeconds) : null,
    nextRunAt,
  }).returning();
  res.status(201).json(task);
});

router.delete("/tasks/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(tasksTable).where(and(eq(tasksTable.id, id), eq(tasksTable.userId, req.session.userId!)));
  res.json({ message: "Deleted" });
});

router.post("/tasks/:id/toggle", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const [task] = await db.select().from(tasksTable)
    .where(and(eq(tasksTable.id, id), eq(tasksTable.userId, req.session.userId!)));
  if (!task) { res.status(404).json({ message: "Not found" }); return; }
  const newActive = !task.isActive;
  const nextRunAt = newActive && task.intervalSeconds
    ? new Date(Date.now() + task.intervalSeconds * 1000) : task.nextRunAt;
  const [updated] = await db.update(tasksTable).set({ isActive: newActive, nextRunAt })
    .where(eq(tasksTable.id, id)).returning();
  res.json(updated);
});

router.post("/tasks/:id/send", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const [task] = await db.select().from(tasksTable)
    .where(and(eq(tasksTable.id, id), eq(tasksTable.userId, req.session.userId!)));
  if (!task) { res.json({ success: false, message: "Not found" }); return; }
  const [token] = await db.select().from(tokensTable).where(eq(tokensTable.id, task.tokenId));
  if (!token || token.status === "invalid") { res.json({ success: false, message: "التوكن غير صالح" }); return; }
  const result = await sendDiscordMessage(token.tokenValue, task.channelId, task.message, task.imagePath);
  await db.insert(logsTable).values({
    taskId: task.id, channelId: task.channelId,
    status: result.success ? "success" : "failed", errorMessage: result.error || null,
  });
  if (result.success) await db.update(tasksTable).set({ sentCount: task.sentCount + 1 }).where(eq(tasksTable.id, id));
  res.json({ success: result.success, message: result.success ? "تم الإرسال بنجاح" : result.error || "فشل الإرسال" });
});

export async function sendDiscordMessage(
  token: string, channelId: string, message: string, imagePath?: string | null,
): Promise<{ success: boolean; error?: string }> {
  const apiUrl = `https://discord.com/api/v10/channels/${channelId}/messages`;
  const auth = { Authorization: token };
  try {
    // Uploaded file → multipart
    if (imagePath?.startsWith("/api/uploads/")) {
      const filename = imagePath.replace("/api/uploads/", "");
      let buf: Buffer;
      try { buf = await fs.readFile(path.join(uploadsDir, filename)); }
      catch { return sendText(apiUrl, auth, message); }
      const ext = path.extname(filename).slice(1).toLowerCase();
      const mime = ({ jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",gif:"image/gif",webp:"image/webp" } as Record<string,string>)[ext] ?? "application/octet-stream";
      const fd = new FormData();
      fd.append("files[0]", new Blob([new Uint8Array(buf)], { type: mime }), filename);
      fd.append("payload_json", JSON.stringify({ content: message }));
      const r = await fetch(apiUrl, { method: "POST", headers: auth, body: fd });
      if (!r.ok) { const e = await r.json() as { message?: string }; return { success: false, error: e.message || `HTTP ${r.status}` }; }
      return { success: true };
    }
    // External URL → embed
    if (imagePath?.startsWith("http")) {
      const r = await fetch(apiUrl, {
        method: "POST", headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify({ content: message, embeds: [{ image: { url: imagePath } }] }),
      });
      if (!r.ok) { const e = await r.json() as { message?: string }; return { success: false, error: e.message || `HTTP ${r.status}` }; }
      return { success: true };
    }
    return sendText(apiUrl, auth, message);
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

async function sendText(url: string, auth: { Authorization: string }, message: string) {
  const r = await fetch(url, {
    method: "POST", headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ content: message }),
  });
  if (!r.ok) { const e = await r.json() as { message?: string }; return { success: false, error: e.message || `HTTP ${r.status}` }; }
  return { success: true };
}

export default router;
