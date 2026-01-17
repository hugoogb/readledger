"use client";

import { signIn } from "@/actions/auth";
import { BookOpen, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    async (_: { error?: string } | null, formData: FormData) => {
      const result = await signIn(formData);
      return result || null;
    },
    null,
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 mb-6 shadow-xl shadow-accent/5">
            <BookOpen className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/70">
            ReadLedger
          </h1>
          <p className="text-foreground-muted mt-2 text-lg">
            Track your manga collection
          </p>
        </div>

        {/* Login form */}
        <Card className="animate-fade-in stagger-1 shadow-2xl shadow-accent/5">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  icon={<Mail className="w-5 h-5" />}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  icon={<Lock className="w-5 h-5" />}
                />
              </div>

              {state?.error && (
                <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  {state.error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-12 text-lg shadow-lg shadow-accent/20"
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-foreground-muted">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-accent hover:text-accent-hover font-semibold transition-colors underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
