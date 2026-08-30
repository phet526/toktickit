import express, { Request, Response } from "express";
import cors from "cors";
import { getPrisma } from "./prisma.js";
import ticketsRouter from "./routes/tickets.router.js";
// getPrisma() is your lazy database handle. Call it INSIDE a route when you
// need the DB (Issue 4). It is intentionally unused until then.
void getPrisma;

// The Express app is exported separately from app.listen() (see index.ts) so
// Supertest can import `app` without opening a port. Do not merge these files.
export const app = express();

app.use(cors());          // already wired: lets the Vite dev server call this API
app.use(express.json());

// Mount the tickets router for Issue 12
app.use("/api/v1/tickets", ticketsRouter);

// ---------------------------------------------------------------------------
// Issue 2 — API health check
// Make the test in tests/lab-01/health.test.ts pass.
// It must return HTTP 200 with JSON: { status: "ok", service: "TokTickIT API" }
// ---------------------------------------------------------------------------
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "TokTickIT API" });
});

// ---------------------------------------------------------------------------
// Issue 4 — Category list
// Add:  GET /api/categories
//   -> read categories from PostgreSQL via getPrisma().category.findMany(...)
//   -> return each { id, name } in a predictable (id) order
//   -> on failure, respond 500 with a safe message (no internal details)
// TODO(Issue 4): implement the route here.
// ---------------------------------------------------------------------------
app.get("/api/categories", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();

    // ดึงข้อมูล category โดยเลือกเฉพาะ id กับ name และเรียงลำดับ id จากน้อยไปมาก
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    // ส่งข้อมูลกลับไปเป็น JSON พร้อม Status 200 OK
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/v1/related-systems for Ticket Creation form dropdown
app.get("/api/v1/related-systems", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const systems = await prisma.relatedSystem.findMany({
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    });
    res.status(200).json(systems);
  } catch (error) {
    console.error("Error fetching related systems:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default app;
