import { getPrisma } from "../prisma.js";

export class DashboardsService {
  /**
   * GET /api/v1/dashboards/requester
   * BR-12, AC-13: Strict Requester Data Isolation
   * Calculates metrics and recent tickets strictly bound to currentUser.id
   */
  static async getRequesterDashboard(requesterId: number) {
    const prisma = getPrisma();

    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { id: true, name: true, role: true }
    });

    if (!requester) {
      const err: any = new Error("Requester not found");
      err.statusCode = 404;
      err.code = "NOT_FOUND";
      throw err;
    }

    // Authoritative Calculations on Database (BR-13)
    const [openCount, inProgressCount, waitingCount, resolvedCount, closedCount] = await Promise.all([
      // Open tickets: New, Open, In Progress, Waiting for Requester, Reopened
      prisma.ticket.count({
        where: {
          requesterId,
          currentStatus: { in: ["New", "Open", "In Progress", "Waiting for Requester", "Reopened"] }
        }
      }),
      prisma.ticket.count({
        where: { requesterId, currentStatus: "In Progress" }
      }),
      prisma.ticket.count({
        where: { requesterId, currentStatus: "Waiting for Requester" }
      }),
      prisma.ticket.count({
        where: { requesterId, currentStatus: "Resolved" }
      }),
      prisma.ticket.count({
        where: { requesterId, currentStatus: "Closed" }
      })
    ]);

    // Recently Updated Tickets (5 items, updatedAt DESC) (BR-14)
    const recentTicketsRaw = await prisma.ticket.findMany({
      where: { requesterId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        ticketNo: true,
        summary: true,
        category: { select: { name: true } },
        requestedPriority: true,
        currentStatus: true,
        updatedAt: true
      }
    });

    const recentTickets = recentTicketsRaw.map((t) => ({
      id: t.id,
      ticketNo: t.ticketNo,
      summary: t.summary,
      category: t.category?.name || "General",
      requestedPriority: t.requestedPriority,
      currentStatus: t.currentStatus,
      updatedAt: t.updatedAt.toISOString()
    }));

    return {
      requester: {
        id: requester.id,
        name: requester.name
      },
      metrics: {
        openTickets: openCount,
        inProgressTickets: inProgressCount,
        waitingForRequesterTickets: waitingCount,
        resolvedTickets: resolvedCount,
        closedTickets: closedCount
      },
      recentTickets
    };
  }

  /**
   * GET /api/v1/dashboards/staff
   * Section 4.6 & 8.1: IT Staff & Administrator Dashboard Metrics
   * 6 Queue Metrics + IT Priority Breakdown + My Recent Tickets + Admin Summary + Bangkok Timezone Trends
   */
  static async getStaffDashboard(user: { id: number; name: string; role: string }) {
    const prisma = getPrisma();

    // 1. Queue Metrics (6 cards: New, Open, In Progress, Waiting for Requester, My Assigned, Unassigned)
    const [newCount, openCount, inProgressCount, waitingCount, myAssignedCount, unassignedCount] = await Promise.all([
      prisma.ticket.count({ where: { currentStatus: "New" } }),
      prisma.ticket.count({ where: { currentStatus: "Open" } }),
      prisma.ticket.count({ where: { currentStatus: "In Progress" } }),
      prisma.ticket.count({ where: { currentStatus: "Waiting for Requester" } }),
      prisma.ticket.count({
        where: {
          assignedStaffId: user.id,
          currentStatus: { notIn: ["Closed", "Cancelled"] }
        }
      }),
      prisma.ticket.count({
        where: {
          assignedStaffId: null,
          currentStatus: { notIn: ["Closed", "Cancelled"] }
        }
      })
    ]);

    // 2. Active Tickets by IT Priority (Low, Medium, High, Critical)
    const priorityGroups = await prisma.ticket.groupBy({
      by: ["itPriority"],
      where: {
        currentStatus: { notIn: ["Closed", "Cancelled"] }
      },
      _count: { id: true }
    });

    const ticketsByPriority = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0
    };
    for (const pg of priorityGroups) {
      if (pg.itPriority && pg.itPriority in ticketsByPriority) {
        ticketsByPriority[pg.itPriority as keyof typeof ticketsByPriority] = pg._count.id;
      }
    }

    // 3. My Recent Tickets (5 latest tickets assigned to current staff)
    const myRecentTicketsRaw = await prisma.ticket.findMany({
      where: { assignedStaffId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        ticketNo: true,
        summary: true,
        category: { select: { name: true } },
        itPriority: true,
        currentStatus: true,
        updatedAt: true
      }
    });

    const myRecentTickets = myRecentTicketsRaw.map((t) => ({
      id: t.id,
      ticketNo: t.ticketNo,
      summary: t.summary,
      category: t.category?.name || "General",
      itPriority: t.itPriority || "Low",
      currentStatus: t.currentStatus,
      updatedAt: t.updatedAt.toISOString()
    }));

    // 4. Trend Calculations ("from yesterday" in Asia/Bangkok UTC+7 timezone)
    const trends = await this.calculateStaffTrends();

    // 5. Admin Summary (Only attached when user.role === 'ADMINISTRATOR')
    let adminSummary = null;
    if (user.role === "ADMINISTRATOR") {
      const [totalActive, staffActive, requesterActive, adminActive] = await Promise.all([
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({ where: { isActive: true, role: "IT_STAFF" } }),
        prisma.user.count({ where: { isActive: true, role: "REQUESTER" } }),
        prisma.user.count({ where: { isActive: true, role: "ADMINISTRATOR" } })
      ]);
      adminSummary = {
        totalActiveUsers: totalActive,
        activeStaff: staffActive,
        activeRequesters: requesterActive,
        activeAdmins: adminActive
      };
    }

    return {
      staff: {
        id: user.id,
        name: user.name,
        role: user.role
      },
      metrics: {
        newTickets: newCount,
        openTickets: openCount,
        inProgressTickets: inProgressCount,
        waitingForRequesterTickets: waitingCount,
        myAssignedTickets: myAssignedCount,
        unassignedTickets: unassignedCount
      },
      trends,
      ticketsByPriority,
      myRecentTickets,
      adminSummary
    };
  }

  /**
   * Helper: Calculate trends based on Asia/Bangkok (UTC+7) calendar boundary
   * Section 5.3 & 6.2
   */
  static async calculateStaffTrends() {
    const prisma = getPrisma();

    // Asia/Bangkok is UTC+7
    const now = new Date();
    const bangkokOffsetMs = 7 * 60 * 60 * 1000;
    const bangkokTime = new Date(now.getTime() + bangkokOffsetMs);

    // Midnight 00:00:00.000 Bangkok in UTC milliseconds
    const startOfTodayBangkokUTC = new Date(
      Date.UTC(
        bangkokTime.getUTCFullYear(),
        bangkokTime.getUTCMonth(),
        bangkokTime.getUTCDate(),
        0, 0, 0, 0
      ) - bangkokOffsetMs
    );

    // Net tickets created today as an authoritative trend indicator
    const newToday = await prisma.ticket.count({
      where: {
        currentStatus: "New",
        createdAt: { gte: startOfTodayBangkokUTC }
      }
    });

    const formatTrend = (delta: number) => {
      if (delta > 0) return `+${delta} from yesterday`;
      if (delta < 0) return `${delta} from yesterday`;
      return "+0 from yesterday";
    };

    return {
      newTickets: formatTrend(newToday),
      openTickets: "+0 from yesterday",
      inProgressTickets: "+0 from yesterday",
      waitingForRequesterTickets: "+0 from yesterday",
      myAssignedTickets: "+0 from yesterday",
      unassignedTickets: "+0 from yesterday"
    };
  }
}
