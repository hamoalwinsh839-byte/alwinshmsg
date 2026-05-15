import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "../db/index.js";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) { res.status(400).json({ message: "Missing fields" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    return;
  }
  req.session.userId = user.id;
  req.session.username = user.username;
  res.json({ id: user.id, username: user.username });
});

router.post("/auth/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || username.length < 3 || password.length < 6) {
    res.status(400).json({ message: "اسم المستخدم 3 أحرف على الأقل وكلمة المرور 6" });
    return;
  }
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing) { res.status(400).json({ message: "اسم المستخدم موجود بالفعل" }); return; }
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ username, passwordHash }).returning();
  req.session.userId = user.id;
  req.session.username = user.username;
  res.status(201).json({ id: user.id, username: user.username });
});

router.get("/auth/me", (req, res) => {
  if (!req.session.userId) { res.status(401).json({ message: "Unauthorized" }); return; }
  res.json({ id: req.session.userId, username: req.session.username });
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {});
  res.json({ message: "Logged out" });
});

export default router;
