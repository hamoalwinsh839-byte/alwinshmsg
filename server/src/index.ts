import "dotenv/config";
import app from "./app.js";
import { startScheduler } from "./scheduler.js";

const port = Number(process.env.PORT ?? 3001);

app.listen(port, () => {
  console.log(`✅ Server listening on http://localhost:${port}`);
  startScheduler();
});
