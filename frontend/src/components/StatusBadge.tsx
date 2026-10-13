import React from "react";
import { LeadStatus } from "@/types/lead";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: LeadStatus | string;
  className?: string;
}

export function getStatusBadgeStyle(status: string): string {
  switch (status) {
    case "New":
      return "bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]";
    case "Contacted":
      return "bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]";
    case "Qualified":
      return "bg-[#E8F0FE] text-[#1967D2] border-[#D2E3FC]";
    case "Proposal Sent":
      return "bg-[#F3E8FD] text-[#8430CE] border-[#E9D2FD]";
    case "Won":
      return "bg-[#F1F3F4] text-[#3C4043] border-[#DADCE0]";
    case "Lost":
      return "bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF]";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const badgeStyle = getStatusBadgeStyle(status);

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase border",
        badgeStyle,
        className
      )}
    >
      {status}
    </span>
  );
}
