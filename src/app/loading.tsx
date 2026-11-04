import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
      <div className="flex items-center gap-3 text-blue-700">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm font-semibold tracking-wide text-slate-800">
          Loading ScholarBridge...
        </span>
      </div>
      <p className="text-xs text-slate-500">
        Fetching source-verified scholarship and application records
      </p>
    </div>
  );
}
