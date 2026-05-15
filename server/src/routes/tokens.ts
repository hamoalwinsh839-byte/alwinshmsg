import { Router } from "express";
import { db, tokensTable } from "../db/index.js";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "./middleware.js";

const router = Router();

router.get("/tokens", requireAuth, async (req, res) => {
  const tokens = await db.select().from(tokensTable).where(eq(tokensTable.userId, req.session.userId!));
  res.json(tokens);
});

router.post("/tokens", requireAuth, async (req, res) => {
  const { tokenValue, label } = req.body;
  if (!tokenValue) { res.status(400).json({ message: "tokenValue required" }); return; }
  const [token] = await db.insert(tokensTable).values({
    userId: req.session.userId!, tokenValue, label: label || null,
  }).returning();
  res.status(201).json(token);
});

router.delete("/tokens/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(tokensTable).where(and(eq(tokensTable.id, id), eq(tokensTable.userId, req.session.userId!)));
  res.json({ message: "Deleted" });
});

router.post("/tokens/:id/test", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const [token] = await db.select().from(tokensTable)
    .where(and(eq(tokensTable.id, id), eq(tokensTable.userId, req.session.userId!)));
  if (!token) { res.status(404).json({ valid: false, message: "Token not found" }); return; }
  try {
    const r = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: token.tokenValue },
    });
    if (r.ok) {
      const data = await r.json() as { username?: string };
      await db.update(tokensTable).set({ status: "active" }).where(eq(tokensTable.id, id));
      res.json({ valid: true, message: `صالح - @${data.username}` });
    } else {
      await db.update(tokensTable).set({ status: "invalid" }).where(eq(tokensTable.id, id));
      res.json({ valid: false, message: "التوكن غير صالح أو منتهي الصلاحية" });
    }
  } catch {
    res.json({ valid: false, message: "فشل الاتصال بـ Discord" });
  }
});

export default router;
