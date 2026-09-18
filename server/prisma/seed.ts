import { getPrisma } from "../src/prisma.js";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const DEFAULT_PASSWORD = "Toktick2026!";
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

async function main() {
  const prisma = getPrisma();

  console.log("🌱 Starting idempotent database seeding for Lab 3...");

  // 1. Categories
  const categories = [
    "Account and Access",
    "Hardware",
    "Software",
    "Network"
  ];
  const categoryMap = new Map<string, number>();
  for (const name of categories) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name }
    });
    categoryMap.set(name, cat.id);
  }
  console.log("✅ Categories seeded");

  // 2. Related Systems
  const systems = [
    "ERP",
    "HRIS",
    "CRM",
    "Email System",
    "VPN",
    "Internal Portal"
  ];
  const systemMap = new Map<string, number>();
  for (const name of systems) {
    const sys = await prisma.relatedSystem.upsert({
      where: { name },
      update: {},
      create: { name }
    });
    systemMap.set(name, sys.id);
  }
  console.log("✅ Related Systems seeded");

  // 3. Users: Requesters (>= 4 active, 1 inactive)
  const requestersData = [
    { name: "Requester A", email: "requester_a@example.com", isActive: true },
    { name: "Requester B", email: "requester_b@example.com", isActive: true },
    { name: "Requester C (Inactive)", email: "requester_c@example.com", isActive: false },
    { name: "Requester D", email: "requester_d@example.com", isActive: true },
    { name: "Requester E", email: "requester_e@example.com", isActive: true },
    { name: "Jennifer Anderson", email: "jennifer.anderson@toktickit.com", isActive: true }
  ];

  const userMap = new Map<string, number>();
  for (const r of requestersData) {
    const isFirstTimeUser = r.email === "requester_e@example.com";
    const user = await prisma.user.upsert({
      where: { email: r.email },
      update: { name: r.name, isActive: r.isActive, mustChangePassword: isFirstTimeUser, passwordHash: DEFAULT_PASSWORD_HASH },
      create: {
        name: r.name,
        email: r.email,
        passwordHash: DEFAULT_PASSWORD_HASH,
        role: Role.REQUESTER,
        isActive: r.isActive,
        mustChangePassword: isFirstTimeUser
      }
    });
    userMap.set(r.email, user.id);
  }
  console.log("✅ Requesters seeded");

  // 4. Users: IT Staff (>= 3 active, 1 inactive)
  const staffData = [
    { name: "Sarah Johnson", email: "sarah.johnson@toktickit.com", isActive: true },
    { name: "Michael Brown", email: "michael.brown@toktickit.com", isActive: true },
    { name: "David Lee", email: "david.lee@toktickit.com", isActive: true },
    { name: "Kevin Patel (Inactive Staff)", email: "kevin.patel@toktickit.com", isActive: false }
  ];

  for (const s of staffData) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: { name: s.name, isActive: s.isActive, role: Role.IT_STAFF, passwordHash: DEFAULT_PASSWORD_HASH, mustChangePassword: false },
      create: {
        name: s.name,
        email: s.email,
        passwordHash: DEFAULT_PASSWORD_HASH,
        role: Role.IT_STAFF,
        isActive: s.isActive,
        mustChangePassword: false
      }
    });
    userMap.set(s.email, user.id);
  }
  console.log("✅ IT Staff seeded");

  // 5. Users: Administrator (>= 1 active)
  const adminData = [
    { name: "John Smith", email: "john.smith@toktickit.com", isActive: true },
    { name: "System Admin", email: "admin@toktickit.com", isActive: true }
  ];

  for (const a of adminData) {
    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: { name: a.name, isActive: a.isActive, role: Role.ADMINISTRATOR, passwordHash: DEFAULT_PASSWORD_HASH, mustChangePassword: false },
      create: {
        name: a.name,
        email: a.email,
        passwordHash: DEFAULT_PASSWORD_HASH,
        role: Role.ADMINISTRATOR,
        isActive: a.isActive,
        mustChangePassword: false
      }
    });
    userMap.set(a.email, user.id);
  }
  console.log("✅ Administrators seeded");

  // 6. Tickets (Distributed across statuses, priorities, ownership)
  const reqAId = userMap.get("requester_a@example.com")!;
  const jenniferId = userMap.get("jennifer.anderson@toktickit.com")!;
  const sarahId = userMap.get("sarah.johnson@toktickit.com")!;
  const michaelId = userMap.get("michael.brown@toktickit.com")!;
  const davidId = userMap.get("david.lee@toktickit.com")!;

  const hardwareCatId = categoryMap.get("Hardware")!;
  const networkCatId = categoryMap.get("Network")!;
  const softwareCatId = categoryMap.get("Software")!;
  const accessCatId = categoryMap.get("Account and Access")!;

  const vpnSysId = systemMap.get("VPN")!;
  const emailSysId = systemMap.get("Email System")!;
  const erpSysId = systemMap.get("ERP")!;

  const sampleTickets = [
    {
      ticketNo: "TKT-2026-00003",
      summary: "Cannot connect to office VPN from home",
      description: "VPN client drops connection every 5 minutes when connecting from home Wi-Fi.",
      requestedPriority: "High",
      itPriority: "Critical",
      currentStatus: "In Progress",
      requesterId: jenniferId,
      assignedStaffId: sarahId,
      categoryId: networkCatId,
      relatedSystemId: vpnSysId
    },
    {
      ticketNo: "TKT-2026-00004",
      summary: "Outlook search indexing stuck",
      description: "Outlook search returns no results since Windows update yesterday.",
      requestedPriority: "Medium",
      itPriority: "Medium",
      currentStatus: "Waiting for Requester",
      requesterId: reqAId,
      assignedStaffId: michaelId,
      categoryId: softwareCatId,
      relatedSystemId: emailSysId
    },
    {
      ticketNo: "TKT-2026-00005",
      summary: "ERP permission request for Q3 audit",
      description: "Need read-only access to ERP finance reports for annual audit review.",
      requestedPriority: "High",
      itPriority: "High",
      currentStatus: "Open",
      requesterId: jenniferId,
      assignedStaffId: davidId,
      categoryId: accessCatId,
      relatedSystemId: erpSysId
    },
    {
      ticketNo: "TKT-2026-00006",
      summary: "External monitor HDMI port not detected",
      description: "Docking station second screen not working after restart.",
      requestedPriority: "Low",
      itPriority: "Low",
      currentStatus: "Resolved",
      requesterId: reqAId,
      assignedStaffId: sarahId,
      categoryId: hardwareCatId,
      relatedSystemId: erpSysId
    },
    {
      ticketNo: "TKT-2026-00007",
      summary: "Printer toner low on 4th floor",
      description: "Yellow toner cartridge needs replacement.",
      requestedPriority: "Low",
      itPriority: "Low",
      currentStatus: "Closed",
      requesterId: reqAId,
      assignedStaffId: michaelId,
      categoryId: hardwareCatId,
      relatedSystemId: erpSysId
    },
    {
      ticketNo: "TKT-2026-00008",
      summary: "Duplicate ticket created by mistake",
      description: "Please cancel this ticket as problem was solved by rebooting.",
      requestedPriority: "Low",
      itPriority: "Low",
      currentStatus: "Cancelled",
      requesterId: reqAId,
      assignedStaffId: null,
      categoryId: softwareCatId,
      relatedSystemId: erpSysId
    }
  ];

  for (const t of sampleTickets) {
    const createdTicket = await prisma.ticket.upsert({
      where: { ticketNo: t.ticketNo },
      update: {
        summary: t.summary,
        description: t.description,
        requestedPriority: t.requestedPriority,
        itPriority: t.itPriority,
        currentStatus: t.currentStatus,
        assignedStaffId: t.assignedStaffId
      },
      create: t
    });

    // 7. Seed Comments and Internal Notes for TKT-2026-00003
    if (t.ticketNo === "TKT-2026-00003") {
      const existingComments = await prisma.comment.count({ where: { ticketId: createdTicket.id } });
      if (existingComments === 0) {
        await prisma.comment.create({
          data: {
            ticketId: createdTicket.id,
            authorId: sarahId,
            content: "We are inspecting the VPN gateway connection logs now."
          }
        });
        await prisma.comment.create({
          data: {
            ticketId: createdTicket.id,
            authorId: jenniferId,
            content: "Thank you Sarah. Let me know if you need traceroute output."
          }
        });
      }

      const existingNotes = await prisma.internalNote.count({ where: { ticketId: createdTicket.id } });
      if (existingNotes === 0) {
        await prisma.internalNote.create({
          data: {
            ticketId: createdTicket.id,
            authorId: sarahId,
            content: "Confirmed MTU mismatch on WAN tunnel interface. Coordinated with NOC engineer."
          }
        });
      }
    }

    // 8. Seed Attachments for Requester A (TKT-2026-00004)
    if (t.ticketNo === "TKT-2026-00004") {
      const existingAttachments = await prisma.attachment.count({ where: { ticketId: createdTicket.id } });
      if (existingAttachments === 0) {
        await prisma.attachment.createMany({
          data: [
            {
              ticketId: createdTicket.id,
              filename: "screenshot_error_indexing.png",
              size: 24580,
              mimeType: "image/png"
            },
            {
              ticketId: createdTicket.id,
              filename: "outlook_event_log.txt",
              size: 10240,
              mimeType: "text/plain"
            },
            {
              ticketId: createdTicket.id,
              filename: "system_info.pdf",
              size: 51200,
              mimeType: "application/pdf"
            }
          ]
        });
      }
    }
  }
  console.log("✅ Sample tickets with comments, notes, and attachments seeded");

  console.log("🎉 All Lab 3 seed data completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });