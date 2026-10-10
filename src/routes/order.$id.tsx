import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, STATUS_LABEL, STATUS_STEPS, type CartLine, type OrderStatus } from "@/lib/menu";

export const Route = createFileRoute("/order/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your Order Status — EMBER" },
      { name: "description", content: "Live status of your EMBER order." },
      { property: "og:title", content: "Order status — EMBER" },
      { property: "og:description", content: "Follow your order live from the kitchen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrderPage,
});

type Order = { id: string; table_number: number; items: CartLine[]; total: number; status: OrderStatus; note: string | null };

function OrderPage() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    supabase.from("orders").select("*").eq("id", id).single().then(({ data }) => data && setOrder(data as unknown as Order));
    const ch = supabase
      .channel(`order-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` }, (p) => setOrder(p.new as Order))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  if (!order) return <p className="p-10 text-center text-muted-foreground">Finding your order…</p>;
  const idx = STATUS_STEPS.indexOf(order.status);

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <span className="font-display text-xl tracking-[0.35em] text-ember">EMBER</span>
      <h1 className="mt-8 text-5xl">{order.status === "ready" ? "It's ready!" : order.status === "served" ? "Enjoy." : "Thank you."}</h1>
      <p className="mt-2 text-muted-foreground">Table {order.table_number} · this page updates live.</p>
      <ol className="mt-8 space-y-4" aria-live="polite">
        {STATUS_STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-4">
            <span className={`flex size-9 items-center justify-center rounded-full border transition-all duration-500 ${i <= idx ? "border-transparent bg-ember text-primary-foreground shadow-ember" : "border-border text-muted-foreground"}`}>
              {i < idx ? <Check className="size-4" /> : i + 1}
            </span>
            <span className={i <= idx ? "text-foreground" : "text-muted-foreground"}>{STATUS_LABEL[s]}</span>
            {i === idx && order.status !== "served" && <span className="ml-auto size-2 animate-ping rounded-full bg-primary" />}
          </li>
        ))}
      </ol>
      <div className="mt-10 rounded-2xl border border-border bg-card/70 p-5">
        <ul className="space-y-1 text-sm">
          {order.items.map((l) => (
            <li key={l.id} className="flex justify-between"><span>{l.qty} × {l.name}</span></li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-border pt-3 font-semibold">
          <span>Total incl. GST</span><span className="text-primary">{formatPrice(Number(order.total))}</span>
        </div>
      </div>
      <Link to="/t/$table" params={{ table: String(order.table_number) }} className="mt-6 block text-center text-sm text-primary">Order something else</Link>
    </main>
  );
}
