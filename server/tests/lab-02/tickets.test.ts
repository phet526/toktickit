import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../../src/app.js";

// Mocking the prisma client and TicketService directly can be complex,
// so we write integration-style tests that hit the endpoint.
// Note: In a real scenario we'd use a test DB or mock the Prisma client.
describe("Ticket Creation & Upload API", () => {
  it("POST /api/v1/tickets should return 400 if required fields are missing", async () => {
    const res = await request(app).post("/api/v1/tickets").send({
      requesterId: 1
      // Missing categoryId, summary, etc.
    });
    
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /api/v1/tickets/:id/attachments should return 400 for files larger than 5MB", async () => {
    // Generate a dummy buffer larger than 5MB
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024, "a");

    const res = await request(app)
      .post("/api/v1/tickets/1/attachments")
      .attach("file", largeBuffer, "large.jpg");

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("File size exceeds 5MB limit");
  });

  it("POST /api/v1/tickets/:id/attachments should return 400 for invalid file types", async () => {
    const dummyBuffer = Buffer.alloc(1024, "a");

    const res = await request(app)
      .post("/api/v1/tickets/1/attachments")
      .attach("file", dummyBuffer, "test.zip"); // Invalid extension/mimetype

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Invalid file type");
  });
});
