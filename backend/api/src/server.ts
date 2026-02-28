import cors from "cors";
import express from "express";
import type { Request, Response } from "express";
import { config } from "./config.js";
import { query } from "./db.js";
import { storageUnitsRouter } from "./routes/storageUnits.js";

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get("/api/health", async (_req: Request, res: Response) => {
  try {
    const now = await query<{ now: string }>("SELECT now()::text AS now");
    res.json({ status: "ok", databaseTime: now.rows[0].now });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error" });
  }
});

app.use("/api", storageUnitsRouter);

app.listen(config.port, () => {
  console.log(`Inventory API listening on http://localhost:${config.port}`);
});
