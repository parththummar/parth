# parththummar.com

Personal site of Parth Thummar — Sr. Backend Developer & eCommerce Solutions Architect.

## Concept

The page is a single ecommerce order, **PT-2013-0001**, tracked through the kind of
fulfillment pipeline I build for a living. Each lifecycle stage is a résumé section:

| Stage | Section |
|---|---|
| 01 · Placed | Hero — order payload (JSON) with a live `in_transit` counter |
| 02 · Validated | About + 3× Adobe Certified Expert checks |
| 03 · Queued | Career stats as queue metrics |
| 04 · Synced | Six featured projects as integration hops, with expandable request traces |
| 05 · Paid | Payment gateways + stack manifest |
| 06 · Fulfilled | 70+ client archive as order history |
| 07 · Delivered | Contact — the order docks |

A fixed packet token rides the rail past checkpoint nodes that stamp timestamps as you
scroll. The footer hides a playable Web Audio step sequencer (the synth hobby is real).

The payload also resolves a `shipping_to` block for the visitor — approximate city
(one anonymous ipapi.co/ipwho.is lookup), local time, weather (open-meteo), device,
viewport, locale, timezone, and connection type. Everything is resolved client-side,
rendered once, and never stored; the delivery confirmation signs off with the
visitor's city. All lookups fail silently and the block simply omits what it
couldn't resolve.

## Stack

- Vanilla HTML / CSS / JS — no frameworks, no build step, no trackers
- Two Google font families (Space Grotesk, JetBrains Mono)
- Hosted on GitHub Pages (`CNAME` → parththummar.com)

## Behaviour notes

- **No-JS**: all content is pre-rendered in its final state; JS-only controls
  (copy button, sequencer transport, card toggles) are injected so nothing renders broken.
- **prefers-reduced-motion**: packet hidden, all animation collapsed to instant states.
- **Keyboard**: `/` or `Cmd/Ctrl+K` opens a jump palette; cards, menu, and sequencer are
  fully keyboard-operable.

## Local preview

```bash
python3 -m http.server 4173
```

`/ip/` is a separate static app (What Is My IP) and is untouched by the main page.
