import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";

describe("Ticket Creation & Upload API", () => {
  let reqId: number, catId: number, sysId: number;

  beforeAll(async () => {
    const { getPrisma } = await import("../../src/prisma.js");
    const prisma = getPrisma();
    const r = await prisma.developmentRequester.findFirst();
    const c = await prisma.category.findFirst();
    const s = await prisma.relatedSystem.findFirst();
    if(r) reqId = r.id;
    if(c) catId = c.id;
    if(s) sysId = s.id;
  });

  it("POST /api/v1/tickets should return 400 if required fields are missing", async () => {
    const res = await request(app).post("/api/v1/tickets").send({
      requesterId: 1
    });
    
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /api/v1/tickets/:id/attachments should return 400 for files larger than 5MB", async () => {
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024, "a");

    const res = await request(app)
      .post("/api/v1/tickets/1/attachments")
      .field("requesterId", reqId || 1)
      .attach("file", largeBuffer, "large.jpg");

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("File size exceeds 5MB limit");
  });

  it("POST /api/v1/tickets/:id/attachments should return 400 for invalid file types", async () => {
    const dummyBuffer = Buffer.alloc(1024, "a");

    const res = await request(app)
      .post("/api/v1/tickets/1/attachments")
      .field("requesterId", reqId || 1)
      .attach("file", dummyBuffer, "test.zip");

    expect(res.body.error).toContain("Invalid file type");
  });

  describe("GET /api/v1/tickets", () => {
    it("should return pagination meta and data array", async () => {
      const res = await request(app).get(`/api/v1/tickets?requesterId=${reqId || 1}&page=1&limit=5`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty("meta");
    });
  });

  describe("DELETE /api/v1/tickets/:id/attachments/:attachmentId", () => {
    it("should perform soft-delete and not hard delete the record", async () => {
      const { getPrisma } = await import("../../src/prisma.js");
      const prisma = getPrisma();
      
      const ticket = await prisma.ticket.create({
        data: {
          ticketNo: "TKT-TEST-999" + Date.now(),
          summary: "Test Soft Delete",
          description: "Testing soft delete of attachments",
          requestedPriority: "LOW",
          currentStatus: "New",
          requesterId: reqId || 1,
          categoryId: catId || 1,
          relatedSystemId: sysId || 1
        }
      });

      const attachment = await prisma.attachment.create({
        data: {
          filename: "test.png",
          size: 1024,
          mimeType: "image/png",
          ticketId: ticket.id
        }
      });

      const countBefore = await prisma.attachment.count({ where: { id: attachment.id } });
      expect(countBefore).toBe(1);

      const res = await request(app)
        .delete(`/api/v1/tickets/${ticket.id}/attachments/${attachment.id}`)
        .send({ requesterId: reqId || 1, reason: "Wrong file uploaded" });

      expect(res.status).toBe(200);

      const countAfter = await prisma.attachment.count({ where: { id: attachment.id } });
      expect(countAfter).toBe(1);

      const deletedAttachment = await prisma.attachment.findUnique({ where: { id: attachment.id } });
      expect(deletedAttachment?.deletedAt).not.toBeNull();
      expect(deletedAttachment?.deletedReason).toBe("Wrong file uploaded");

      await prisma.attachment.delete({ where: { id: attachment.id } }).catch(() => {});
      await prisma.ticket.delete({ where: { id: ticket.id } }).catch(() => {});
    });
  });
});
