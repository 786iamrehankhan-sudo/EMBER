import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import pizza from "@/assets/wood-pizza.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EMBER — Modern Café | Scan, Order, Savour" },
      { name: "description", content: "Contactless table ordering at EMBER modern café with interactive 3D dish previews." },
      { property: "og:title", content: "EMBER — Modern Café" },
      { property: "og:description", content: "Scan your table QR, explore dishes in 3D and order in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [table, setTable] = useState("1");
  const navigate = useNavigate();
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
      <header className="flex items-center justify-between">
        <span className="font-display text-2xl tracking-[0.35em] text-ember">EMBER</span>
        <nav className="flex gap-4 text-sm text-muted-foreground">
          <Link to="/qr" className="hover:text-foreground">Table QR codes</Link>
          <Link to="/kitchen" className="hover:text-foreground">Kitchen</Link>
        </nav>
      </header>
      <section className="grid flex-1 items-center gap-10 py-12 md:grid-cols-2">
        <div className="animate-rise">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Modern café · fusion kitchen</p>
          <h1 className="mt-4 text-6xl leading-[0.95] md:text-7xl">
            Taste it <em className="text-ember">before</em> you order.
          </h1>
          <p className="mt-5 max-w-md text-muted-foreground">
            Scan the code on your table, spin every dish in 3D, and send your order straight to our kitchen.
          </p>
          <form
            className="mt-8 flex items-center gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/t/$table", params: { table } });
            }}
          >
            <label className="sr-only" htmlFor="table">Table number</label>
            <input
              id="table"
              type="number"
              min={1}
              max={200}
              value={table}
              onChange={(e) => setTable(e.target.value)}
              className="h-12 w-24 rounded-full border border-input bg-card px-5 text-center text-lg"
            />
            <Button variant="ember" size="lg" type="submit">Open menu</Button>
          </form>
        </div>
        <div className="relative animate-rise [animation-delay:150ms]">
          <div className="absolute inset-8 rounded-full bg-primary/20 blur-3xl" />
          <img src={pizza} alt="Wood-fired margherita pizza" width={816} height={816} className="relative mx-auto w-full max-w-md rounded-full" />
        </div>
      </section>
    </main>
  );
}
