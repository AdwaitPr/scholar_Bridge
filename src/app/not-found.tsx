import React from "react";
import Link from "next/link";
import { GraduationCap, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-xs space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-700">
          <GraduationCap className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            The scholarship, application record, or page you are looking for
            does not exist or may have been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/scholarships" className="w-full sm:w-auto">
            <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white gap-1.5 text-xs">
              <Search className="h-3.5 w-3.5" />
              <span>Browse Catalog</span>
            </Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full gap-1.5 text-xs text-slate-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return Home</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
