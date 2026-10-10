# Live walkthrough: one order, Table 5, guest side to kitchen side

No staff account exists yet, so this walkthrough also creates your first login. I'll run both halves myself in a separate browser — you don't click anything — and report back with what I saw and screenshots. The first account created automatically becomes staff.

There is already one test order on the board, Table 5, sitting at "Received" for ₹472.50. It will be visible as a second card so you can see the board handling more than one order.

## What happens, beat by beat

1. **Start clean** — your preview goes to the home page.
2. **Guest order** — I drive your preview tab: Table 5 → menu → tap a dish → drag it to spin the plate → pick quantities → add two dishes → "View order" → write a note for the kitchen → "Send to kitchen". You land on the status page reading **Received**.
3. **Staff account** — in a separate browser I create the staff login myself and sign in. If the new account needs an email confirmation click before it can sign in, I stop there and tell you rather than changing backend settings.
4. **Kitchen board** — signed in, the board shows both Table 5 orders under "Received". I tap **Mark Accepted**, then **Mark Cooking**, then **Mark Ready**.
5. **The payoff** — as those taps land on the kitchen board, the guest's own status page ticks along by itself. No refreshing, no button. That's the live link between the two screens.
6. **The QR sheet** — finally we open the printable table codes page so you can see what goes on the tables.

```text
guest tab                          kitchen tab
Table 5 menu  --send-->  Received
                          Accepted   <-- my tap
                          Cooking    <-- my tap
                          Ready      <-- my tap  == guest page updates itself
```

## What this proves, and what it doesn't

It proves the ordering path, the live status updates, and the staff board all work together. It does not touch online payment (still pay at the table), the menu admin screen (still not built), or true 3D models (the plates are photos right now).

## Technical details

- Guest side driven in the live preview tab: `/t/5`, dish modal, cart in local storage, insert into `orders`, redirect to `/order/$id`.
- Realtime: both pages listen on the `orders` table; the status page filters on its own order id, so it only moves when that order moves.
- Totals come from the database trigger (`compute_order_total`) reading menu prices and adding 5% GST — the amount shown in the cart is display only.
- Staff check: `user_roles` via the first-signup trigger in `handle_new_user_role`. The kitchen board reads the role to decide whether the advance buttons are live.
- If the new account can't sign in without an email confirmation click, I'll say so and hand the staff half to you rather than changing backend settings.
