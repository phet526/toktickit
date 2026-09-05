import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { getPrisma } from "../../src/prisma";
import fs from "fs";
import path from "path";

describe("Attachments API", () => {
  const prisma = getPrisma();
  let requester: any, category: any, system: any;
  let ticket: any;

  beforeAll(async () => {
    const suffix = Date.now().toString();
    requester = await prisma.developmentRequester.create({ data: { name: `Attach User ${suffix}`, email: `attach_${suffix}@test.com`, isActive: true } });
    
    // Instead of creating new category/system, use existing seeded ones to avoid breaking Lab 1 tests
    category = await prisma.category.findFirst();
    system = await prisma.relatedSystem.findFirst();

    ticket = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-ATTACH-001-${suffix}`,
        summary: "Attachment Test Ticket",
        description: "Testing attachments",
        requestedPriority: "LOW",
        currentStatus: "New",
        requesterId: requester.id,
        categoryId: category.id,
        relatedSystemId: system.id,
      }
    });
  });

  afterAll(async () => {
    if (ticket) await prisma.attachment.deleteMany({ where: { ticketId: ticket.id } }).catch(() => {});
    if (ticket) await prisma.ticket.delete({ where: { id: ticket.id } }).catch(() => {});
    if (requester) await prisma.developmentRequester.delete({ where: { id: requester.id } }).catch(() => {});
  });

  it("API-06: Should allow upload after ticket creation", async () => {
    // Create a dummy file buffer
    const buffer = Buffer.from("dummy file content");

    const res = await request(app)
      .post(`/api/v1/tickets/${ticket.id}/attachments`)
      .field("requesterId", requester.id)
      .attach("file", buffer, "test.pdf");

    expect([200, 201]).toContain(res.status); // 201 ideally
  });

  it("API-03: Should reject large files (e.g., 6MB)", async () => {
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024, "A"); // 6MB
    const res = await request(app)
      .post(`/api/v1/tickets/${ticket.id}/attachments`)
      .field("requesterId", requester.id)
      .attach("file", largeBuffer, "large.pdf");

    expect(res.status).toBe(400);
  });

  it("API-04 & API-07: Soft-remove attachment and prevent download", async () => {
    // First, upload a file and mock its DB entry since the real one doesn't save to DB in our controller yet
    const attachment = await prisma.attachment.create({
      data: {
        ticketId: ticket.id,
        filename: "test.pdf",
        size: 1024,
        mimeType: "application/pdf"
      }
    });

    // Soft delete
    const delRes = await request(app)
      .delete(`/api/v1/tickets/${ticket.id}/attachments/${attachment.id}`)
      .send({ requesterId: requester.id, reason: "Test delete" });

    expect(delRes.status).toBe(200);

    // Verify DB
    const dbAttachment = await prisma.attachment.findUnique({ where: { id: attachment.id } });
    expect(dbAttachment?.deletedAt).not.toBeNull();
    expect(dbAttachment?.deletedReason).toBe("Test delete");

    // Download should fail (API-07)
    const dlRes = await request(app).get(`/api/v1/tickets/${ticket.id}/attachments/${attachment.id}/download?requesterId=${requester.id}`);
    expect(dlRes.status).toBe(403);
  });
});
