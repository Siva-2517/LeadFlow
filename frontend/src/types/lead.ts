export type LeadStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Proposal Sent"
  | "Won"
  | "Lost";

export interface Discussion {
  id: string;
  lead_id: string;
  note: string;
  follow_up_at: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  status: LeadStatus;
  next_follow_up_at: string | null;
  created_at: string;
  updated_at: string;
  latest_discussion_note: string | null;
  latest_discussion_at: string | null;
  is_today_follow_up: boolean;
  is_overdue: boolean;
}

export interface LeadDetail extends Lead {
  discussions: Discussion[];
}

export interface StatsSummary {
  total_leads: number;
  follow_ups_today: number;
  overdue_follow_ups: number;
  won_leads: number;
}

export interface CreateLeadPayload {
  name: string;
  company?: string | null;
  phone?: string | null;
  status?: LeadStatus;
}

export interface UpdateLeadPayload {
  name?: string;
  company?: string | null;
  phone?: string | null;
  status?: LeadStatus;
  next_follow_up_at?: string | null;
  clear_follow_up?: boolean;
}

export interface CreateDiscussionPayload {
  note: string;
  follow_up_at?: string | null;
  clear_follow_up?: boolean;
}
