"use client";

import React, { useState, useMemo } from "react";
import Header from "@/components/Header";
import MetricsCards from "@/components/MetricsCards";
import FilterBar from "@/components/FilterBar";
import TodayFollowUps from "@/components/TodayFollowUps";
import LeadCard from "@/components/LeadCard";
import AddLeadModal from "@/components/AddLeadModal";
import LeadTimelineModal from "@/components/LeadTimelineModal";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Lead } from "@/types/lead";
import { Users, AlertCircle, RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Fetch leads with query and status filters
  const {
    data: leads = [],
    isLoading: isLeadsLoading,
    isError: isLeadsError,
    error: leadsError,
    refetch: refetchLeads,
  } = useQuery({
    queryKey: ["leads", searchQuery, selectedStatus],
    queryFn: () =>
      api.getLeads({
        query: searchQuery.trim() || undefined,
        status: selectedStatus !== "All" ? selectedStatus : undefined,
      }),
  });

  // Fetch summary stats
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => api.getStats(),
  });

  // Separate leads into today's follow-ups and remaining leads
  const { todayLeads, otherLeads } = useMemo(() => {
    const today: Lead[] = [];
    const other: Lead[] = [];

    leads.forEach((l) => {
      if (l.is_today_follow_up) {
        today.push(l);
      } else {
        other.push(l);
      }
    });

    return { todayLeads: today, otherLeads: other };
  }, [leads]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedStatus("All");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Top Header */}
      <Header onOpenAddModal={() => setIsAddModalOpen(true)} />

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title & Subtitle */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Lead Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage relationships, conversations, and follow-ups in one place.
          </p>
        </div>

        {/* Metrics Overview Cards */}
        <MetricsCards stats={stats} isLoading={isStatsLoading} />

        {/* Filters and Search Bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          onResetFilters={handleResetFilters}
        />

        {/* Loading State */}
        {isLeadsLoading && (
          <div className="space-y-4 my-6">
            <div className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />
            <div className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />
            <div className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />
          </div>
        )}

        {/* Error State */}
        {isLeadsError && (
          <div className="my-8 p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-rose-900">
                Unable to load leads from backend
              </h3>
              <p className="text-xs text-rose-700 mt-1">
                {(leadsError as Error)?.message ||
                  "Ensure the FastAPI server is running."}
              </p>
              <button
                type="button"
                onClick={() => refetchLeads()}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Today's Follow-ups Section matching LandingPage-PravarAI.png */}
        {!isLeadsLoading && !isLeadsError && (
          <TodayFollowUps
            leads={todayLeads}
            onSelectLead={(l) => setSelectedLeadId(l.id)}
          />
        )}

        {/* All Leads Section */}
        {!isLeadsLoading && !isLeadsError && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                All Leads
              </h2>
              <span className="text-xs text-slate-400">
                Showing {leads.length} lead{leads.length === 1 ? "" : "s"}
              </span>
            </div>

            {leads.length === 0 ? (
              /* Empty state */
              <div className="text-center py-16 bg-white border border-slate-200/90 rounded-2xl shadow-xs p-8">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  No leads found
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {searchQuery || selectedStatus !== "All"
                    ? "No leads matched your current filters. Try resetting the filters or modifying your search term."
                    : "No leads are available in the database yet. Click 'Add New Lead' to get started."}
                </p>
                {(searchQuery || selectedStatus !== "All") && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {otherLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onClick={() => setSelectedLeadId(lead.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Lead Timeline Dialog */}
      <LeadTimelineModal
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
      />
    </div>
  );
}
