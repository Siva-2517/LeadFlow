import React from "react";
import { StatsSummary } from "@/types/lead";
import { Users, Calendar, AlertCircle, Award } from "lucide-react";

interface MetricsCardsProps {
  stats: StatsSummary | undefined;
  isLoading: boolean;
}

export default function MetricsCards({ stats, isLoading }: MetricsCardsProps) {
  const cards = [
    {
      label: "Total Leads",
      value: stats?.total_leads ?? 0,
      icon: Users,
      color: "text-slate-600 bg-slate-100",
      accent: "border-slate-200",
    },
    {
      label: "Follow-ups Today",
      value: stats?.follow_ups_today ?? 0,
      icon: Calendar,
      color: "text-blue-600 bg-blue-50",
      accent: "border-blue-200",
    },
    {
      label: "Overdue Follow-ups",
      value: stats?.overdue_follow_ups ?? 0,
      icon: AlertCircle,
      color: "text-rose-600 bg-rose-50",
      accent: "border-rose-200",
    },
    {
      label: "Won Leads",
      value: stats?.won_leads ?? 0,
      icon: Award,
      color: "text-emerald-600 bg-emerald-50",
      accent: "border-emerald-200",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs transition hover:border-slate-300"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {card.label}
              </span>
              <div className={`p-1.5 rounded-lg ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline">
              {isLoading ? (
                <div className="h-8 w-12 bg-slate-100 animate-pulse rounded" />
              ) : (
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {card.value}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
