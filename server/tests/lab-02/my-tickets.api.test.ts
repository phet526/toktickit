import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { getPrisma } from "../../src/prisma";

describe("My Tickets API", () => {
  const prisma = getPrisma();
  let requester1: any, requester2: any, category: any, system: any;
  let t1: any, t2: any, t3: any;

  beforeAll(async () => {
    // Setup test data
    const suffix = Date.now().toString();
    requester1 = await prisma.developmentRequester.create({ data: { name: `Test User 1 ${suffix}`, email: `test1_${suffix}@test.com`, isActive: true } });
    requester2 = await prisma.developmentRequester.create({ data: { name: `Test User 2 ${suffix}`, email: `test2_${suffix}@test.com`, isActive: true } });
    category = await prisma.category.findFirst();
    system = await prisma.relatedSystem.findFirst();

    t1 = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-TEST-001-${suffix}`,
        summary: "Ticket 1 R1",
        description: "Desc 1",
        requestedPriority: "LOW",
        currentStatus: "New",
        requesterId: requester1.id,
        categoryId: category.id,
        relatedSystemId: system.id,
      }
    });

    t2 = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-TEST-002-${suffix}`,
        summary: "Ticket 2 R1 Searchable",
        description: "Desc 2",
        requestedPriority: "MEDIUM",
        currentStatus: "New",
        requesterId: requester1.id,
        categoryId: category.id,
        relatedSystemId: system.id,
      }
    });

    t3 = await prisma.ticket.create({
      data: {
        ticketNo: `TKT-TEST-003-${suffix}`,
        summary: "Ticket 3 R2",
        description: "Desc 3",
        requestedPriority: "HIGH",
        currentStatus: "New",
        requesterId: requester2.id,
        categoryId: category.id,
        relatedSystemId: system.id,
      }
    });
  });

  afterAll(async () => {
    // Cleanup only the data created by this test
    if (t1) await prisma.ticket.delete({ where: { id: t1.id } }).catch(() => {});
    if (t2) await prisma.ticket.delete({ where: { id: t2.id } }).catch(() => {});
    if (t3) await prisma.ticket.delete({ where: { id: t3.id } }).catch(() => {});
    if (requester1) await prisma.developmentRequester.delete({ where: { id: requester1.id } }).catch(() => {});
    if (requester2) await prisma.developmentRequester.delete({ where: { id: requester2.id } }).catch(() => {});
  });

  it("API-02: Should not return Ticket B for Requester A (Ownership)", async () => {
    const res = await request(app).get(`/api/v1/tickets?requesterId=${requester1.id}`);
    expect(res.status).toBe(200);
    
    // R1 should only see t1 and t2, not t3
    expect(res.body.data.length).toBe(2);
    const ticketIds = res.body.data.map((t: any) => t.id);
    expect(ticketIds).toContain(t1.id);
    expect(ticketIds).toContain(t2.id);
    expect(ticketIds).not.toContain(t3.id);

    // Direct access to t3 by R1 should fail
    const resDetail = await request(app).get(`/api/v1/tickets/${t3.id}?requesterId=${requester1.id}`);
    expect(resDetail.status).toBe(403);
  });

  it("API-05: Should return tickets matching search term with pagination", async () => {
    const res = await request(app).get(`/api/v1/tickets?requesterId=${requester1.id}&search=Searchable&limit=1`);
    expect(res.status).toBe(200);
    
    // Should only find t2
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].summary).toBe("Ticket 2 R1 Searchable");
    expect(res.body.meta.totalItems).toBe(1);
  });
});
