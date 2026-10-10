import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/qr")({
  head: () => ({
    meta: [
      { title: "Table QR Codes — EMBER" },
      { name: "description", content: "Printable QR codes for every EMBER table." },
      { property: "og:title", content: "Table QR Codes — EMBER" },
      { property: "og:description", content: "Print a QR code for each table." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QrPage,
});

function QrPage() {
  const [origin, setOrigin] = useState("");
  const [count, setCount] = useState(12);
  useEffect(() => setOrigin(window.location.origin), []);
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <h1 className="text-5xl">Table QR codes</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground">Tables
            <input type="number" min={1} max={100} value={count} onChange={(e) => setCount(Math.min(100, Math.max(1, Number(e.target.value))))} className="ml-2 h-10 w-20 rounded-full border border-input bg-card px-3 text-center" />
          </label>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
        {origin && Array.from({ length: count }, (_, i) => i + 1).map((t) => (
          <div key={t} className="flex flex-col items-center rounded-2xl border border-border bg-card p-4">
            <span className="font-display tracking-[0.3em] text-ember">EMBER</span>
            <div className="mt-3 rounded-xl bg-foreground p-3">
              <QRCodeSVG value={`${origin}/t/${t}`} size={120} bgColor="transparent" fgColor="currentColor" className="text-background" />
            </div>
            <span className="mt-3 text-lg">Table {t}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
