import { PrismaClient } from "@prisma/client";

// Module augmentation so existing Lab 2 code & tests typecheck without error
declare module "@prisma/client" {
  interface PrismaClient {
    developmentRequester: any;
  }
}

// Lazy singleton: the client is created on first use, not at import time.
// This keeps route modules and tests that don't touch the DB (e.g. /api/health)
// free of database side effects.
let client: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!client) {
    const rawClient = new PrismaClient();
    client = new Proxy(rawClient, {
      get(target: any, prop: string | symbol, receiver: any) {
        if (prop === "developmentRequester") {
          return new Proxy(target.user, {
            get(userTarget: any, userProp: string | symbol, userReceiver: any) {
              if (userProp === "create") {
                return (args: any) => {
                  const data = { ...args.data };
                  if (!data.passwordHash) {
                    data.passwordHash = "$2b$10$nBm3SKBJGe5DJ5nBGvGqAuEpk/GWdJzPtlRdxD.zYZ3ys6W/lwPGi";
                  }
                  if (!data.role) {
                    data.role = "REQUESTER";
                  }
                  return userTarget.create({ ...args, data });
                };
              }
              return Reflect.get(userTarget, userProp, userReceiver);
            }
          });
        }
        if (prop === "ticket") {
          return new Proxy(target.ticket, {
            get(ticketTarget: any, ticketProp: string | symbol, ticketReceiver: any) {
              if (ticketProp === "create") {
                return (args: any) => {
                  const data = { ...args.data };
                  if (!data.itPriority && data.requestedPriority) {
                    data.itPriority = data.requestedPriority;
                  }
                  return ticketTarget.create({ ...args, data });
                };
              }
              return Reflect.get(ticketTarget, ticketProp, ticketReceiver);
            }
          });
        }
        return Reflect.get(target, prop, receiver);
      }
    }) as PrismaClient;
  }
  return client;
}
