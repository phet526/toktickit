export const STATUS_TRANSITIONS: Record<string, string[]> = {
  "New": ["Open", "In Progress", "Cancelled"],
  "Open": ["In Progress", "Waiting for Requester", "Resolved", "Cancelled"],
  "In Progress": ["Waiting for Requester", "Resolved", "Cancelled"],
  "Waiting for Requester": ["In Progress", "Resolved", "Cancelled"],
  "Resolved": ["Closed", "Reopened"],
  "Closed": ["Reopened"],
  "Reopened": ["In Progress", "Waiting for Requester", "Resolved", "Cancelled"],
  "Cancelled": ["Reopened"]
};

export const PERMITTED_STATUSES = Object.keys(STATUS_TRANSITIONS);

export const PERMITTED_IT_PRIORITIES = ["Low", "Medium", "High", "Critical"];

export function getPermittedStatusTransitions(currentStatus: string): string[] {
  // Normalize match
  const key = Object.keys(STATUS_TRANSITIONS).find(
    (k) => k.toLowerCase() === (currentStatus || "").toLowerCase()
  );
  return key ? STATUS_TRANSITIONS[key] : [];
}

export function isValidStatusTransition(fromStatus: string, toStatus: string): boolean {
  if (!fromStatus || !toStatus) return false;
  const permittedNext = getPermittedStatusTransitions(fromStatus);
  return permittedNext.some((s) => s.toLowerCase() === toStatus.toLowerCase());
}

export function isValidITPriority(priority: string): boolean {
  if (!priority) return false;
  return PERMITTED_IT_PRIORITIES.some((p) => p.toLowerCase() === priority.toLowerCase());
}

export function normalizeITPriority(priority: string): string {
  const match = PERMITTED_IT_PRIORITIES.find((p) => p.toLowerCase() === priority.toLowerCase());
  return match || priority;
}
