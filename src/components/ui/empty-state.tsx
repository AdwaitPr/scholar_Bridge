import React from "react";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  onReset?: () => void;
}

export function EmptyState({
  title = "No scholarships match your filters",
  description = "Try adjusting your search keywords, education level, or clearing some filters.",
  onReset,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-4">
        <SearchX className="h-7 w-7" />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
      <p className="max-w-sm text-xs text-slate-500 mb-6">{description}</p>
      {onReset && (
        <Button variant="outline" size="sm" onClick={onReset}>
          Reset All Filters
        </Button>
      )}
    </div>
  );
}
