import React from "react";
import { Lead } from "@/types/lead";
import StatusBadge from "./StatusBadge";
import { formatRelativeTime, formatFollowUpBadge } from "@/lib/date";
import { Bell, AlertCircle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
  isTodaySection?: boolean;
}

export default function LeadCard({
  lead,
  onClick,
  isTodaySection = false,
}: LeadCardProps) {
  const relativeTime = formatRelativeTime(lead.latest_discussion_at);
  const followUpText = formatFollowUpBadge(lead.next_follow_up_at);

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 sm:p-5 rounded-xl border transition-all cursor-pointer group shadow-xs hover:shadow-sm",
        isTodaySection
          ? "bg-[#F8FAFF] border-blue-200 hover:border-blue-300"
          : lead.is_overdue
          ? "bg-white border-rose-200/90 hover:border-rose-300"
          : "bg-white border-slate-200/90 hover:border-slate-300"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-baseline flex-wrap gap-1.5">
            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              {lead.name}
            </h3>
            {lead.company && (
              <span className="text-sm font-normal text-slate-500">
                ({lead.company})
              </span>
            )}
            {lead.phone && (
              <span className="text-xs text-slate-400 font-mono ml-1 hidden sm:inline">
                • {lead.phone}
              </span>
            )}
          </div>

          {/* Last Note row matching LandingPage-PravarAI.png */}
          <div className="mt-2 text-xs sm:text-sm text-slate-600 flex items-center flex-wrap gap-1.5">
            <span className="font-semibold text-slate-700">Last Note:</span>
            {lead.latest_discussion_note ? (
              <span className="line-clamp-1 text-slate-600">
                {lead.latest_discussion_note}
              </span>
            ) : (
              <span className="italic text-slate-400">
                No discussions logged yet.
              </span>
            )}
            {relativeTime && (
              <span className="text-slate-400 text-xs ml-1 shrink-0">
                {relativeTime}
              </span>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="shrink-0">
          <StatusBadge status={lead.status} />
        </div>
      </div>

      {/* Follow-up tags */}
      <div className="mt-3.5 flex items-center flex-wrap gap-2">
        {lead.is_today_follow_up && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#EBF3FE] text-[#1967D2] border border-blue-200/60">
            <Bell className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{followUpText}</span>
          </div>
        )}

        {lead.is_overdue && !lead.is_today_follow_up && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FCE8E6] text-[#C5221F] border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Overdue: {followUpText.replace("Follow-up set for: ", "")}</span>
          </div>
        )}

        {!lead.is_today_follow_up && !lead.is_overdue && lead.next_follow_up_at && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{followUpText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
