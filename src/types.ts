export type Stage = "Discussion" | "Development" | "QA" | "Deployment" | "Sign-off";
export type Priority = "Low" | "Medium" | "High" | "Critical";
export type BugSeverity = "Critical" | "Minor" | "Cosmetic";
export type BugStatus = "Open" | "In Progress" | "Resolved" | "Accepted";

export interface Bug {
  id: string;
  title: string;
  severity: BugSeverity;
  status: BugStatus;
  attribution: "Development" | "Requirement" | "Environment" | "Third-party";
  createdAt: string;
  notes: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  checked: boolean;
  note?: string;
}

export interface TicketEvent {
  id: string;
  at: string;
  actor: string;
  title: string;
  detail: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  project: string;
  module: string;
  assignee: string;
  qaOwner: string;
  priority: Priority;
  stage: Stage;
  createdAt: string;
  eta: string;
  originalEta: string;
  revisedEtaReason?: string;
  estimateHours: number;
  complexity: "Small" | "Medium" | "Large" | "XL";
  acceptanceCriteria: string[];
  blockedHours: number;
  blockedReason?: string;
  comments: TicketEvent[];
  bugs: Bug[];
  checklist: ChecklistItem[];
  deploymentNotes: string;
  deploymentEnvironment: string;
  signoffComment?: string;
  score?: number;
}