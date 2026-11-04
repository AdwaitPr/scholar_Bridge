"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log unexpected errors
    console.error("ScholarBridge App Error:", error);
  }, [error]);

  const isNetworkError =
    error.message?.toLowerCase().includes("network") ||
    error.message?.toLowerCase().includes("offline") ||
    error.message?.toLowerCase().includes("fetch failed");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-xs space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          {isNetworkError ? (
            <WifiOff className="h-8 w-8" />
          ) : (
            <AlertCircle className="h-8 w-8" />
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {isNetworkError
              ? "Network Connection Interrupted"
              : "Something Went Wrong"}
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            {isNetworkError
              ? "We couldn't connect to the server. Please check your internet connection and retry."
              : "An unexpected error occurred while loading this page. Our team has been alerted."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-blue-700 hover:bg-blue-800 text-white gap-1.5 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </Button>
          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full gap-1.5 text-xs text-slate-700"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
