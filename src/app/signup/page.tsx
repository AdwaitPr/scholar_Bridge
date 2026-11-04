"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, User, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Registration failed");
      }

      // Automatically log in or redirect to onboarding
      router.push("/onboarding");
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md space-y-4">
        {/* Privacy by Minimization Banner */}
        <div className="flex items-start gap-2 rounded-lg border border-teal-200 bg-teal-50 p-3 text-xs text-teal-900">
          <ShieldCheck className="h-4 w-4 shrink-0 text-teal-700 mt-0.5" />
          <p>
            <strong>Privacy Guarantee:</strong> We collect only academic details
            needed for eligibility matching. We never store Aadhaar, bank
            account numbers, or document uploads.
          </p>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="space-y-1">
            <Link
              href="/"
              className="text-xl font-bold tracking-tight text-slate-900"
            >
              Scholar<span className="text-blue-600">Bridge</span>
            </Link>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Create Student Account
            </CardTitle>
            <CardDescription>
              Discover scholarships you qualify for and track application
              deadlines.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {errorMsg && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name / Preferred Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ananya Sharma"
                    className="pl-9"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@example.edu.in"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password (min. 6 characters)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-700 hover:bg-blue-800"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Continue to Onboarding"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-2 border-t p-4 text-center text-sm text-slate-600">
            <div>
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-700 hover:underline"
              >
                Sign In
              </Link>
            </div>
            <div>
              <Link
                href="/scholarships"
                className="text-xs text-slate-500 hover:underline"
              >
                Explore scholarships without signing up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
