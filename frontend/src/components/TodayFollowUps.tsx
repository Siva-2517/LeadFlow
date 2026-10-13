import React from "react";
import { Lead } from "@/types/lead";
import LeadCard from "./LeadCard";
import { Pin } from "lucide-react";

interface TodayFollowUpsProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

export default function TodayFollowUps({
  leads,
  onSelectLead,
}: TodayFollowUpsProps) {
  if (leads.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Pin className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
        <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase">
          Today's Follow-ups
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onClick={() => onSelectLead(lead)}
            isTodaySection={true}
          />
        ))}
      </div>
    </div>
  );
}
