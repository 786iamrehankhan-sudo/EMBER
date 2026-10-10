import sandwich from "@/assets/ember-sandwich.jpg";
import montadito from "@/assets/montadito.jpg";
import pizza from "@/assets/wood-pizza.jpg";
import momos from "@/assets/momos.jpg";
import pasta from "@/assets/truffle-pasta.jpg";
import cappuccino from "@/assets/cappuccino.jpg";
import latte from "@/assets/latte.jpg";

export const dishImages: Record<string, string> = {
  "ember-sandwich": sandwich,
  montadito,
  "wood-pizza": pizza,
  momos,
  "truffle-pasta": pasta,
  cappuccino,
  latte,
};

export const TAX_RATE = 0.05;
export const formatPrice = (n: number) => `₹${n.toFixed(0)}`;

export type CartLine = { id: string; name: string; price: number; qty: number };

export const STATUS_STEPS = ["received", "accepted", "cooking", "ready", "served"] as const;
export type OrderStatus = (typeof STATUS_STEPS)[number];
export const STATUS_LABEL: Record<OrderStatus, string> = {
  received: "Received",
  accepted: "Accepted",
  cooking: "Cooking",
  ready: "Ready",
  served: "Served",
};
