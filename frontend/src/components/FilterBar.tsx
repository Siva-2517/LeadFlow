import React from "react";
import { Search, X } from "lucide-react";
import { LeadStatus } from "@/types/lead";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: Array<"All" | LeadStatus> = [
  "All",
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Won",
  "Lost",
];

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  onResetFilters: () => void;
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  onResetFilters,
}: FilterBarProps) {
  const isFiltered = searchQuery.trim().length > 0 || selectedStatus !== "All";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      {/* Status pills matching LandingPage-PravarAI.png */}
      <div className="flex items-center flex-wrap gap-2">
        <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase mr-1">
          FILTERS:
        </span>
        {STATUS_FILTERS.map((status) => {
          const isActive = selectedStatus === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => onStatusChange(status)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-[#1E293B] text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              {status}
            </button>
          );
        })}

        {isFiltered && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-2 underline underline-offset-2 cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:w-64">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search leads..."
          className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
