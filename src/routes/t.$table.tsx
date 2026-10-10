import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag, X, Leaf, Flame, Rotate3d } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { dishImages, formatPrice, TAX_RATE, type CartLine } from "@/lib/menu";

const DishViewer = lazy(() => import("@/components/DishViewer"));

export const Route = createFileRoute("/t/$table")({
  ssr: false,
  head: ({ params }) => ({
    meta: [
      { title: `Table ${params.table} Menu — EMBER` },
      { name: "description", content: "Browse EMBER's menu in 3D and order from your table." },
      { property: "og:title", content: "EMBER Menu" },
      { property: "og:description", content: "Spin every dish in 3D and order from your table." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MenuPage,
});

type Item = { id: string; name: string; category: string; description: string; price: number; veg: boolean; spicy: boolean };

function MenuPage() {
  const { table } = Route.useParams();
  const navigate = useNavigate();
  const tableNum = Number(table);
  const cartKey = `ember-cart-${table}`;
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["menu"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_items").select("*").eq("available", true).order("sort");
      if (error) throw error;
      return data as Item[];
    },
  });
  const [cat, setCat] = useState("All");
  const [vegOnly, setVegOnly] = useState(false);
  const [open, setOpen] = useState<Item | null>(null);
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [note, setNote] = useState("");
  const [bump, setBump] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    try { setCart(JSON.parse(localStorage.getItem(cartKey) || "[]")); } catch { /* ignore */ }
  }, [cartKey]);
  useEffect(() => { localStorage.setItem(cartKey, JSON.stringify(cart)); }, [cart, cartKey]);

  const cats = useMemo(() => ["All", ...Array.from(new Set(items.map((i) => i.category)))], [items]);
  const shown = items.filter((i) => (cat === "All" || i.category === cat) && (!vegOnly || i.veg));
  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const count = cart.reduce((s, l) => s + l.qty, 0);

  const add = (it: Item, q: number) => {
    setCart((c) => {
      const ex = c.find((l) => l.id === it.id);
      return ex ? c.map((l) => (l.id === it.id ? { ...l, qty: Math.min(20, l.qty + q) } : l)) : [...c, { id: it.id, name: it.name, price: Number(it.price), qty: q }];
    });
    setBump((b) => b + 1);
    toast.success(`${it.name} added`);
  };
  const change = (id: string, d: number) =>
    setCart((c) => c.map((l) => (l.id === id ? { ...l, qty: l.qty + d } : l)).filter((l) => l.qty > 0));

  const placeOrder = async () => {
    setSending(true);
    const { data, error } = await supabase
      .from("orders")
      .insert({ table_number: tableNum, items: cart, note: note.trim() || null })
      .select("id")
      .single();
    setSending(false);
    if (error || !data) { toast.error("Couldn't send your order. Please try again."); return; }
    setCart([]);
    navigate({ to: "/order/$id", params: { id: data.id } });
  };

  if (!Number.isInteger(tableNum) || tableNum < 1 || tableNum > 200)
    return <p className="p-10 text-center">Unknown table. <Link to="/" className="text-primary">Go home</Link></p>;

  return (
    <main className="mx-auto max-w-3xl px-5 pb-32 pt-6">
      <header className="flex items-center justify-between">
        <Link to="/" className="font-display text-xl tracking-[0.35em] text-ember">EMBER</Link>
        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">Table {table}</span>
      </header>
      <h1 className="mt-8 text-5xl">Tonight's menu</h1>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full px-4 py-1.5 text-sm transition ${cat === c ? "bg-ember text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{c}</button>
        ))}
        <button onClick={() => setVegOnly((v) => !v)} aria-pressed={vegOnly} className={`ml-auto flex items-center gap-1 rounded-full px-3 py-1.5 text-sm ${vegOnly ? "bg-success/20 text-success" : "bg-secondary text-muted-foreground"}`}>
          <Leaf className="size-4" /> Veg
        </button>
      </div>

      {isLoading && <p className="mt-10 text-muted-foreground">Warming up the kitchen…</p>}
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {shown.map((it, i) => (
          <li key={it.id} style={{ animationDelay: `${i * 60}ms` }} className="animate-rise">
            <button onClick={() => { setOpen(it); setQty(1); }} className="group flex w-full gap-4 rounded-2xl border border-border bg-card/70 p-3 text-left transition hover:border-primary/50 hover:shadow-ember">
              <img src={dishImages[it.id]} alt={it.name} loading="lazy" width={96} height={96} className="size-24 rounded-full object-cover transition duration-500 group-hover:rotate-12 group-hover:scale-105" />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xl leading-tight">{it.name}</h3>
                  {it.spicy && <Flame className="size-4 text-primary" aria-label="Spicy" />}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{it.description}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-semibold text-primary">{formatPrice(Number(it.price))}</span>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Rotate3d className="size-3.5" /> 3D</span>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center" onClick={() => setOpen(null)}>
          <div role="dialog" aria-label={open.name} className="w-full max-w-lg animate-rise rounded-t-3xl border border-border bg-card p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end">
              <button onClick={() => setOpen(null)} aria-label="Close" className="rounded-full p-1 text-muted-foreground hover:text-foreground"><X /></button>
            </div>
            <div className="h-72 w-full">
              <Suspense fallback={<img src={dishImages[open.id]} alt="" className="mx-auto h-full rounded-full" />}>
                <DishViewer image={dishImages[open.id] ?? ""} />
              </Suspense>
            </div>
            <p className="text-center text-[11px] text-muted-foreground">Drag to rotate · pinch to zoom</p>
            <h2 className="mt-3 text-3xl">{open.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{open.description}</p>
            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-3 rounded-full bg-secondary p-1">
                <button aria-label="Less" onClick={() => setQty((q) => Math.max(1, q - 1))} className="rounded-full p-2 hover:bg-accent"><Minus className="size-4" /></button>
                <span className="w-5 text-center">{qty}</span>
                <button aria-label="More" onClick={() => setQty((q) => Math.min(20, q + 1))} className="rounded-full p-2 hover:bg-accent"><Plus className="size-4" /></button>
              </div>
              <Button variant="ember" size="lg" onClick={() => { add(open, qty); setOpen(null); }}>
                Add · {formatPrice(Number(open.price) * qty)}
              </Button>
            </div>
          </div>
        </div>
      )}

      {count > 0 && !cartOpen && (
        <div className="fixed inset-x-0 bottom-5 z-30 flex justify-center px-5">
          <Button key={bump} variant="ember" size="lg" className="w-full max-w-md animate-pop" onClick={() => setCartOpen(true)}>
            <ShoppingBag /> View order · {count} · {formatPrice(subtotal)}
          </Button>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center" onClick={() => setCartOpen(false)}>
          <div role="dialog" aria-label="Your order" className="w-full max-w-lg animate-rise rounded-t-3xl border border-border bg-card p-6 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-3xl">Your order</h2>
              <button onClick={() => setCartOpen(false)} aria-label="Close"><X /></button>
            </div>
            <ul className="mt-4 divide-y divide-border">
              {cart.map((l) => (
                <li key={l.id} className="flex items-center gap-3 py-3">
                  <img src={dishImages[l.id]} alt="" className="size-12 rounded-full" />
                  <span className="flex-1">{l.name}</span>
                  <div className="flex items-center gap-2">
                    <button aria-label="Less" onClick={() => change(l.id, -1)} className="rounded-full bg-secondary p-1"><Minus className="size-3" /></button>
                    <span className="w-4 text-center text-sm">{l.qty}</span>
                    <button aria-label="More" onClick={() => change(l.id, 1)} className="rounded-full bg-secondary p-1"><Plus className="size-3" /></button>
                  </div>
                  <span className="w-16 text-right text-sm">{formatPrice(l.price * l.qty)}</span>
                </li>
              ))}
            </ul>
            <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 300))} placeholder="Notes for the kitchen (allergies, less spicy…)" className="mt-3 w-full rounded-xl border border-input bg-background p-3 text-sm" rows={2} />
            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground"><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
              <div className="flex justify-between text-muted-foreground"><dt>GST 5%</dt><dd>{formatPrice(subtotal * TAX_RATE)}</dd></div>
              <div className="flex justify-between text-lg font-semibold"><dt>Total</dt><dd className="text-primary">{formatPrice(subtotal * (1 + TAX_RATE))}</dd></div>
            </dl>
            <Button variant="ember" size="lg" className="mt-5 w-full" disabled={sending || !cart.length} onClick={placeOrder}>
              {sending ? "Sending…" : "Send to kitchen"}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">Pay at the table when you're done.</p>
          </div>
        </div>
      )}
    </main>
  );
}
