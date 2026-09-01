const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface Category {
  id: number;
  name: string;
}

export interface RelatedSystem {
  id: number;
  name: string;
}

export interface DevelopmentRequester {
  id: number;
  name: string;
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

export async function checkSystem(): Promise<SystemStatus> {
  const healthRes = await fetch(`${API_URL}/api/health`);
  if (!healthRes.ok) {
    throw new Error("Health check failed");
  }

  const categoriesRes = await fetch(`${API_URL}/api/categories`);
  if (!categoriesRes.ok) {
    throw new Error("Categories fetch failed");
  }

  const categories = await categoriesRes.json();
  return { online: true, categories };
}

export async function getRelatedSystems(): Promise<RelatedSystem[]> {
  const res = await fetch(`${API_URL}/api/v1/related-systems`);
  if (!res.ok) throw new Error("Failed to fetch related systems");
  return res.json();
}

export async function getRequesters(): Promise<DevelopmentRequester[]> {
  const res = await fetch(`${API_URL}/api/v1/requesters`);
  if (!res.ok) throw new Error("Failed to fetch requesters");
  return res.json();
}

export interface CreateTicketPayload {
  requesterId: number;
  categoryId: number;
  relatedSystemId: number;
  summary: string;
  description: string;
  requestedPriority: string;
}

export async function createTicket(payload: CreateTicketPayload) {
  const res = await fetch(`${API_URL}/api/v1/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create ticket");
  }
  
  return res.json();
}

export async function uploadAttachment(ticketId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/v1/tickets/${ticketId}/attachments`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to upload file");
  }

  return res.json();
}
