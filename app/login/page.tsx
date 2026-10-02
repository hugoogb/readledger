"use client";

import { sendOtp, verifyOtp } from "@/actions/auth";
import { ArrowLeft, ArrowRight, BookOpen, KeyRound, Mail } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
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

const RESEND_COOLDOWN_S = 30;

export default function LoginPage() {
  // Set once a code has been sent; switches the form to the code step.
  const [email, setEmail] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

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

        <Card className="animate-fade-in stagger-1 shadow-2xl shadow-accent/5">
          {email === null ? (
            <EmailStep
              onSent={(sentTo) => {
                setEmail(sentTo);
                setCooldown(RESEND_COOLDOWN_S);
              }}
            />
          ) : (
            <CodeStep
              email={email}
              cooldown={cooldown}
              onResent={() => setCooldown(RESEND_COOLDOWN_S)}
              onChangeEmail={() => setEmail(null)}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm animate-in fade-in slide-in-from-top-2 duration-300"
    >
      {message}
    </div>
  );
}

function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const [state, formAction, isPending] = useActionState(
    async (_: { error?: string } | null, formData: FormData) => {
      const result = await sendOtp(formData);
      if (result.email) {
        onSent(result.email);
        return null;
      }
      return { error: result.error };
    },
    null,
  );

  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a 6-digit code. New here? Your
          account is created automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              required
              placeholder="you@example.com"
              icon={<Mail className="w-5 h-5" />}
            />
          </div>

          <ErrorBox message={state?.error} />

          <Button
            type="submit"
            loading={isPending}
            className="w-full h-12 text-lg shadow-lg shadow-accent/20"
          >
            Send code
            {!isPending && <ArrowRight className="w-5 h-5" />}
          </Button>
        </form>

        {/* Transition notice for users who signed up with a password. */}
        <p className="mt-6 text-center text-xs text-foreground-muted">
          ReadLedger no longer uses passwords. Your collection is still here,
          just sign in with the code we email you.
        </p>
      </CardContent>
    </>
  );
}

function CodeStep({
  email,
  cooldown,
  onResent,
  onChangeEmail,
}: {
  email: string;
  cooldown: number;
  onResent: () => void;
  onChangeEmail: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [code, setCode] = useState("");
  const [isResending, startResend] = useTransition();
  const [state, formAction, isPending] = useActionState(
    async (_: { error?: string } | null, formData: FormData) => {
      const result = await verifyOtp(formData);
      // On success verifyOtp redirects and this never returns.
      setCode("");
      return result ?? null;
    },
    null,
  );

  function handleCodeChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    // Auto-submit on the 6th digit (typed, pasted or autofilled).
    if (digits.length === 6 && !isPending) {
      queueMicrotask(() => formRef.current?.requestSubmit());
    }
  }

  function handleResend() {
    startResend(async () => {
      const formData = new FormData();
      formData.set("email", email);
      const result = await sendOtp(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("New code sent");
        onResent();
      }
    });
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">Check your email</CardTitle>
        <CardDescription>
          We sent a 6-digit code to{" "}
          <span className="font-medium text-foreground [overflow-wrap:anywhere]">{email}</span>.
          It expires in 10 minutes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-6">
          <input type="hidden" name="email" value={email} />
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              autoFocus
              required
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="123456"
              aria-describedby="code-hint"
              className="text-center text-2xl sm:text-2xl tracking-[0.5em] font-mono"
              icon={<KeyRound className="w-5 h-5" />}
            />
            <p id="code-hint" className="text-xs text-foreground-muted">
              Can&apos;t find it? Check your spam folder.
            </p>
          </div>

          <ErrorBox message={state?.error} />

          <Button
            type="submit"
            loading={isPending}
            disabled={code.length !== 6}
            className="w-full h-12 text-lg shadow-lg shadow-accent/20"
          >
            Sign in
            {!isPending && <ArrowRight className="w-5 h-5" />}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-between gap-2 text-sm">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onChangeEmail}
            className="-ml-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Different email
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResend}
            loading={isResending}
            disabled={cooldown > 0}
            className="-mr-3"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </Button>
        </div>
      </CardContent>
    </>
  );
}
