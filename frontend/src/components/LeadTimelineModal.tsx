"use client";

import React, { useState } from "react";
import { Lead, LeadStatus } from "@/types/lead";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatTimelineTimestamp } from "@/lib/date";
import {
  X,
  Phone,
  Calendar,
  ChevronDown,
  Check,
  Loader2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadTimelineModalProps {
  leadId: string | null;
  onClose: () => void;
}

const ALL_STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Won",
  "Lost",
];

export default function LeadTimelineModal({
  leadId,
  onClose,
}: LeadTimelineModalProps) {
  const queryClient = useQueryClient();
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // New discussion form states
  const [note, setNote] = useState("");
  const [isFollowUpEnabled, setIsFollowUpEnabled] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Fetch lead details with discussions
  const {
    data: lead,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["lead", leadId],
    queryFn: () => (leadId ? api.getLead(leadId) : null),
    enabled: !!leadId,
  });

  // Mutation for updating status
  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: LeadStatus) => {
      if (!leadId) throw new Error("Missing lead ID");
      return api.updateLead(leadId, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      showToast("Status updated successfully");
      setIsStatusDropdownOpen(false);
    },
    onError: (err: Error) => {
      setSubmitError(err.message || "Failed to update status");
    },
  });

  // Mutation for clearing existing follow-up
  const clearFollowUpMutation = useMutation({
    mutationFn: () => {
      if (!leadId) throw new Error("Missing lead ID");
      return api.updateLead(leadId, { clear_follow_up: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      showToast("Scheduled follow-up cleared");
    },
  });

  // Mutation for adding a discussion
  const addDiscussionMutation = useMutation({
    mutationFn: async () => {
      if (!leadId) throw new Error("Missing lead ID");
      const trimmedNote = note.trim();
      if (!trimmedNote) {
        throw new Error("Discussion note cannot be empty");
      }

      let followUpIso: string | null = null;
      if (isFollowUpEnabled && followUpDate) {
        const timePart = followUpTime || "14:00";
        // Combine date and time
        const combined = new Date(`${followUpDate}T${timePart}:00`);
        if (!isNaN(combined.getTime())) {
          followUpIso = combined.toISOString();
        }
      }

      return api.createDiscussion(leadId, {
        note: trimmedNote,
        follow_up_at: followUpIso,
        clear_follow_up: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      // Reset form
      setNote("");
      setIsFollowUpEnabled(false);
      setFollowUpDate("");
      setFollowUpTime("");
      setSubmitError(null);
      showToast("Discussion note saved successfully");
    },
    onError: (err: Error) => {
      setSubmitError(err.message || "Failed to save discussion");
    },
  });

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 3000);
  };

  if (!leadId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header matching EditLead-PravarAI.png */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4 bg-white relative">
          {isLoading ? (
            <div className="h-10 w-48 bg-slate-100 animate-pulse rounded" />
          ) : lead ? (
            <div>
              <div className="flex items-baseline flex-wrap gap-1.5">
                <h2 className="text-lg font-bold text-slate-900">
                  {lead.name}
                </h2>
                {lead.company && (
                  <span className="text-sm font-normal text-slate-500">
                    ({lead.company})
                  </span>
                )}
              </div>
              {lead.phone && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lead.phone}</span>
                </div>
              )}
            </div>
          ) : null}

          {/* Status selector & Close Button */}
          <div className="flex items-center gap-3">
            {lead && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-800 hover:border-slate-300 shadow-2xs transition cursor-pointer"
                >
                  <span>{lead.status}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Status Dropdown Menu matching EditLead-PravarAI.png */}
                {isStatusDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                    {ALL_STATUSES.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => updateStatusMutation.mutate(st)}
                        className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between transition cursor-pointer"
                      >
                        <span>{st}</span>
                        {lead.status === st && (
                          <Check className="w-3.5 h-3.5 text-slate-900" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success toast notification */}
        {successToast && (
          <div className="bg-emerald-50 text-emerald-800 text-xs px-6 py-2 border-b border-emerald-200 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Current Active Follow-up Banner if scheduled */}
        {lead?.next_follow_up_at && (
          <div className="px-6 py-2.5 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-blue-900 font-medium">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>
                Active Follow-up:{" "}
                {formatTimelineTimestamp(lead.next_follow_up_at).replace(
                  /\s*\(.*?\)/,
                  ""
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={() => clearFollowUpMutation.mutate()}
              disabled={clearFollowUpMutation.isPending}
              className="text-slate-400 hover:text-rose-600 inline-flex items-center gap-1 transition cursor-pointer text-[11px]"
              title="Clear scheduled follow-up"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Follow-up</span>
            </button>
          </div>
        )}

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="text-sm">Loading lead discussions...</span>
            </div>
          )}

          {isError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {(error as Error)?.message || "Failed to load timeline."}
            </div>
          )}

          {lead && lead.discussions.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm italic">
              No discussions recorded yet. Add the first note below!
            </div>
          )}

          {lead && lead.discussions.length > 0 && (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {lead.discussions.map((disc, idx) => {
                const isFirst = idx === 0;
                return (
                  <div key={disc.id} className="relative group">
                    {/* Timeline Node Dot */}
                    <div
                      className={cn(
                        "absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white transition",
                        isFirst ? "bg-blue-600 ring-4 ring-blue-100" : "bg-slate-300"
                      )}
                    />

                    {/* Timestamp header */}
                    <div className="text-xs text-slate-500 mb-1.5 font-medium">
                      {formatTimelineTimestamp(disc.created_at)}
                    </div>

                    {/* Note content box matching EditLead-PravarAI.png */}
                    <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs text-slate-800 text-sm whitespace-pre-wrap leading-relaxed">
                      {disc.note}

                      {/* Attached follow-up badge */}
                      {disc.follow_up_at && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#EBF3FE] text-[#1967D2] border border-blue-200/60">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            <span>
                              Follow-up set for:{" "}
                              {formatTimelineTimestamp(disc.follow_up_at).replace(
                                /\s*\(.*?\)/,
                                ""
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Discussion Form matching EditLead-PravarAI.png bottom */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white">
          {submitError && (
            <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {submitError}
            </div>
          )}

          <div className="space-y-3">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Log a new discussion..."
              rows={3}
              className="w-full p-3 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Checkbox and Date/Time pickers */}
              <div className="flex items-center flex-wrap gap-2.5">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isFollowUpEnabled}
                    onChange={(e) => setIsFollowUpEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Set Follow-up</span>
                </label>

                {isFollowUpEnabled && (
                  <div className="flex items-center gap-2 animate-in fade-in duration-100">
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="time"
                      value={followUpTime}
                      onChange={(e) => setFollowUpTime(e.target.value)}
                      className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Submit Note Button */}
              <button
                type="button"
                onClick={() => addDiscussionMutation.mutate()}
                disabled={addDiscussionMutation.isPending || !note.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2 bg-[#0F172A] hover:bg-black active:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {addDiscussionMutation.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                Save Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
