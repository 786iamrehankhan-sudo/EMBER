import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Staff Sign In — EMBER" },
      { name: "description", content: "Sign in to the EMBER kitchen screen." },
      { property: "og:title", content: "Staff Sign In — EMBER" },
      { property: "og:description", content: "Kitchen staff access." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    // Get the current origin for proper redirects
    const redirectUrl = `${window.location.origin}/kitchen`;
    
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      navigate({ to: "/kitchen" });
    } else {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password, 
        options: { 
          emailRedirectTo: redirectUrl,
          data: {
            redirect_to: redirectUrl
          }
        } 
      });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Check your email to confirm your account.");
      setMode("in");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm animate-rise rounded-3xl border border-border bg-card p-8">
        <span className="font-display text-xl tracking-[0.35em] text-ember">EMBER</span>
        <h1 className="mt-4 text-4xl">{mode === "in" ? "Kitchen sign in" : "Create staff account"}</h1>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="mt-6 h-11 w-full rounded-xl border border-input bg-background px-4" />
        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="mt-3 h-11 w-full rounded-xl border border-input bg-background px-4" />
        <Button variant="ember" size="lg" type="submit" disabled={busy} className="mt-5 w-full">{mode === "in" ? "Sign in" : "Sign up"}</Button>
        <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground">
          {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}
