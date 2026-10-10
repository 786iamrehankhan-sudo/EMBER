import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { STATUS_LABEL, STATUS_STEPS, type CartLine, type OrderStatus } from "@/lib/menu";

export const Route = createFileRoute("/_authenticated/kitchen")({
  head: () => ({
    meta: [
      { title: "Kitchen Board — EMBER" },
      { name: "description", content: "Live incoming orders for EMBER staff." },
      { property: "og:title", content: "Kitchen Board — EMBER" },
      { property: "og:description", content: "Live incoming orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Kitchen,
});

type Order = { id: string; table_number: number; items: CartLine[]; note: string | null; status: OrderStatus; created_at: string };
const COLUMNS: OrderStatus[] = ["received", "accepted", "cooking", "ready"];

function Kitchen() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isStaff, setIsStaff] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", u.user!.id);
      setIsStaff(!!r?.some((x) => x.role === "staff" || x.role === "admin"));
    })();
    const load = async () => {
      const { data } = await supabase.from("orders").select("*").neq("status", "served").order("created_at");
      if (data) setOrders(data as unknown as Order[]);
    };
    load();
    const ch = supabase
      .channel("kitchen")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (p) => {
        if (p.eventType === "INSERT") toast(`New order · Table ${(p.new as Order).table_number}`);
        load();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const advance = async (o: Order) => {
    const next = STATUS_STEPS[STATUS_STEPS.indexOf(o.status) + 1] ?? "served";
    const { error } = await supabase.from("orders").update({ status: next }).eq("id", o.id);
    if (error) toast.error("Couldn't update order");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <main className="px-6 py-6">
      <header className="flex items-center justify-between">
        <div className="flex items-baseline gap-4">
          <span className="font-display text-xl tracking-[0.35em] text-ember">EMBER</span>
          <h1 className="text-3xl">Kitchen</h1>
        </div>
        <Button variant="glass" onClick={signOut}>Sign out</Button>
      </header>
      {isStaff === false && (
        <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
          Your account isn't marked as staff yet, so you can view orders but not update them.
        </p>
      )}
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {COLUMNS.map((col) => {
          const list = orders.filter((o) => o.status === col);
          return (
            <section key={col} className="rounded-2xl border border-border bg-card/50 p-3">
              <h2 className="mb-3 flex items-center justify-between px-1 font-sans text-sm uppercase tracking-widest text-muted-foreground">
                {STATUS_LABEL[col]} <span className="rounded-full bg-secondary px-2 text-xs">{list.length}</span>
              </h2>
              <div className="space-y-3">
                {list.map((o) => (
                  <article key={o.id} className="animate-rise rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-2xl">Table {o.table_number}</span>
                      <span className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <ul className="mt-2 text-sm">
                      {o.items.map((l) => <li key={l.id}><span className="text-primary">{l.qty}×</span> {l.name}</li>)}
                    </ul>
                    {o.note && <p className="mt-2 rounded-lg bg-secondary p-2 text-xs italic">“{o.note}”</p>}
                    <Button variant="ember" className="mt-3 w-full" disabled={!isStaff} onClick={() => advance(o)}>
                      Mark {STATUS_LABEL[STATUS_STEPS[STATUS_STEPS.indexOf(o.status) + 1] ?? "served"]}
                    </Button>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
