const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface Category {
  id: number;
  name: string;
}

export interface RelatedSystem {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";
  isActive: boolean;
  mustChangePassword?: boolean;
}

export interface DevelopmentRequester {
  id: number;
  name: string;
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

export async function login(email: string, password: string): Promise<{ message: string; user: User }> {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Login failed");
  }

  return res.json();
}

export async function logout(): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/api/v1/auth/logout`, {
    method: "POST",
    credentials: "include"
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Logout failed");
  }

  return res.json();
}

export async function getMe(): Promise<{ user: User }> {
  const res = await fetch(`${API_URL}/api/v1/auth/me`, {
    method: "GET",
    credentials: "include"
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Not authenticated");
  }

  return res.json();
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ message: string; mustChangePassword: boolean }> {
  const res = await fetch(`${API_URL}/api/v1/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to change password");
  }

  return res.json();
}

export async function checkSystem(): Promise<SystemStatus> {
  const healthRes = await fetch(`${API_URL}/api/health`, { credentials: "include" });
  if (!healthRes.ok) {
    throw new Error("Health check failed");
  }

  const categoriesRes = await fetch(`${API_URL}/api/categories`, { credentials: "include" });
  if (!categoriesRes.ok) {
    throw new Error("Categories fetch failed");
  }

  const categories = await categoriesRes.json();
  return { online: true, categories };
}

export async function getRelatedSystems(): Promise<RelatedSystem[]> {
  const res = await fetch(`${API_URL}/api/v1/related-systems`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch related systems");
  return res.json();
}

export async function getRequesters(): Promise<DevelopmentRequester[]> {
  const res = await fetch(`${API_URL}/api/v1/requesters/active`, { credentials: "include" });
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
    credentials: "include",
    body: JSON.stringify(payload)
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create ticket");
  }
  
  return res.json();
}

export async function uploadAttachment(ticketId: number, file: File, requesterId?: number) {
  const formData = new FormData();
  formData.append("file", file);

  const query = requesterId ? `?requesterId=${requesterId}` : "";
  const res = await fetch(`${API_URL}/api/v1/tickets/${ticketId}/attachments${query}`, {
    method: "POST",
    credentials: "include",
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to upload file");
  }

  return res.json();
}

export interface TicketListParams {
  requesterId?: number;
  search?: string;
  category?: string;
  system?: string;
  status?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export async function getTickets(params: TicketListParams) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.append(key, value.toString());
    }
  });

  const res = await fetch(`${API_URL}/api/v1/tickets?${query.toString()}`, {
    credentials: "include"
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch tickets");
  }
  return res.json();
}

export async function getTicketById(id: number, requesterId?: number) {
  const query = requesterId ? `?requesterId=${requesterId}` : "";
  const res = await fetch(`${API_URL}/api/v1/tickets/${id}${query}`, {
    credentials: "include"
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch ticket");
  }
  return res.json();
}

export async function deleteAttachment(ticketId: number, attachmentId: number, requesterId: number, reason: string) {
  const res = await fetch(`${API_URL}/api/v1/tickets/${ticketId}/attachments/${attachmentId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ requesterId, reason })
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete attachment");
  }
  return res.json();
}

export interface StaffTicketItem {
  id: number;
  ticketNo: string;
  createdDate: string;
  summary: string;
  category: string;
  requestedPriority: string;
  itPriority: string;
  currentStatus: string;
  ticketOwner: { id: number; name: string } | null;
  problemResolvedReported: boolean;
}

export interface StaffTicketPaginationMeta {
  totalItems: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

export interface StaffTicketListResponse {
  data: StaffTicketItem[];
  meta: StaffTicketPaginationMeta;
}

export interface StaffTicketQueryParams {
  search?: string;
  status?: string;
  category?: string;
  priority?: string;
  owner?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export async function getStaffTickets(params: StaffTicketQueryParams): Promise<StaffTicketListResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.append(key, value.toString());
    }
  });

  const res = await fetch(`${API_URL}/api/v1/staff/tickets?${query.toString()}`, {
    credentials: "include"
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch staff tickets");
  }

  return res.json();
}

export interface StaffTicketDetail {
  id: number;
  ticketNo: string;
  summary: string;
  description: string;
  requestedPriority: string;
  itPriority: string;
  currentStatus: string;
  problemResolvedReported: boolean;
  createdAt: string;
  updatedAt: string;
  category: { id: number; name: string };
  relatedSystem: { id: number; name: string };
  requester: { id: number; name: string; email: string };
  assignedStaff: { id: number; name: string; email?: string } | null;
  attachments: {
    id: number;
    filename: string;
    size: number;
    mimeType: string;
    deletedAt?: string | null;
    deletedReason?: string | null;
  }[];
  permittedStatusTransitions: string[];
}

export interface CommentItem {
  id: number;
  content: string;
  author: { id: number; name: string; role: string };
  createdAt: string;
}

export interface InternalNoteItem {
  id: number;
  content: string;
  author: { id: number; name: string; role: string };
  createdAt: string;
}

export interface ActiveStaffMember {
  id: number;
  name: string;
  email: string;
}

export async function getStaffTicketDetail(id: number): Promise<StaffTicketDetail> {
  const res = await fetch(`${API_URL}/api/v1/staff/tickets/${id}`, {
    credentials: "include"
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch ticket details");
  }

  return res.json();
}

export async function updateTicketOwnership(
  ticketId: number,
  assignedStaffId: number
): Promise<{ message: string; assignedStaff: { id: number; name: string } | null }> {
  const res = await fetch(`${API_URL}/api/v1/staff/tickets/${ticketId}/ownership`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ assignedStaffId })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to update ticket ownership");
  }

  return res.json();
}

export async function updateITPriority(
  ticketId: number,
  itPriority: string
): Promise<{ message: string; itPriority: string }> {
  const res = await fetch(`${API_URL}/api/v1/staff/tickets/${ticketId}/priority`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ itPriority })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to update IT Priority");
  }

  return res.json();
}

export async function updateTicketStatus(
  ticketId: number,
  status: string
): Promise<{ message: string; currentStatus: string }> {
  const res = await fetch(`${API_URL}/api/v1/staff/tickets/${ticketId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to update ticket status");
  }

  return res.json();
}

export async function getPublicComments(ticketId: number): Promise<CommentItem[]> {
  const res = await fetch(`${API_URL}/api/v1/tickets/${ticketId}/comments`, {
    credentials: "include"
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch comments");
  }

  return res.json();
}

export async function createPublicComment(ticketId: number, content: string): Promise<CommentItem> {
  const res = await fetch(`${API_URL}/api/v1/tickets/${ticketId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ content })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to post comment");
  }

  return res.json();
}

export async function getInternalNotes(ticketId: number): Promise<InternalNoteItem[]> {
  const res = await fetch(`${API_URL}/api/v1/staff/tickets/${ticketId}/notes`, {
    credentials: "include"
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch internal notes");
  }

  return res.json();
}

export async function createInternalNote(ticketId: number, content: string): Promise<InternalNoteItem> {
  const res = await fetch(`${API_URL}/api/v1/staff/tickets/${ticketId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ content })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to save internal note");
  }

  return res.json();
}

export async function getActiveStaffList(): Promise<ActiveStaffMember[]> {
  const res = await fetch(`${API_URL}/api/v1/staff/active`, {
    credentials: "include"
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch active staff");
  }

  return res.json();
}

export async function indicateProblemResolved(
  ticketId: number
): Promise<{ message: string; problemResolvedReported: boolean }> {
  const res = await fetch(`${API_URL}/api/v1/tickets/${ticketId}/resolve-indication`, {
    method: "POST",
    credentials: "include"
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to indicate problem resolved");
  }

  return res.json();
}


