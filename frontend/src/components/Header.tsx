import React from "react";
import { TrendingUp, Plus } from "lucide-react";

interface HeaderProps {
  onOpenAddModal: () => void;
}

export default function Header({ onOpenAddModal }: HeaderProps) {
  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-blue-600">
            LeadFlow
          </span>
        </div>

        <button
          onClick={onOpenAddModal}
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Add New Lead
        </button>
      </div>
    </header>
  );
}
