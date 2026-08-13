/*import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
void request; void app;

// Issue 4 — write this test yourself, using health.test.ts as the pattern.
// Requires the DB to be migrated and seeded first.
// It should assert: GET /api/categories returns 200 and the four seeded
// category names in id order.
describe.todo("GET /api/categories", () => {
  it.todo("returns the four seeded categories in id order", async () => {
    // TODO(Issue 4): implement this assertion.
    expect(true).toBe(true);
  });
});*/

import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

// Issue 4 — write this test yourself, using health.test.ts as the pattern.
// Requires the DB to be migrated and seeded first.
// It should assert: GET /api/categories returns 200 and the four seeded
// category names in id order.
describe("GET /api/categories", () => {
  it("returns the four seeded categories in id order", async () => {
    // 1. จำลองการเรียก API
    const res = await request(app).get("/api/categories");

    // 2. เช็คว่าคืนค่า Status 200 สำเร็จ
    expect(res.status).toBe(200);

    // 3. เช็คว่ามีข้อมูลส่งมา 4 หมวดหมู่เป๊ะๆ
    expect(res.body).toHaveLength(4);

    // 4. เช็คว่าข้อมูลเรียงตามลำดับ ID และชื่อตรงตามที่ Seed ไว้
    expect(res.body[0].name).toBe("Account and Access");
    expect(res.body[1].name).toBe("Hardware");
    expect(res.body[2].name).toBe("Software");
    expect(res.body[3].name).toBe("Network");
  });
});
