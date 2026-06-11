# parththummar.com

Personal site of Parth Thummar — Sr. Backend Developer & eCommerce Solutions Architect.

## Concept

The page is a single ecommerce order, **PT-2013-&lt;current year&gt;** (the year part
updates itself every January), tracked through the kind of fulfillment pipeline I
build for a living. Each lifecycle stage is a résumé section:

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
viewport, locale, timezone, and connection type. Device details come straight from
browser APIs; the geo and weather lookups are anonymous third-party calls whose
results are rendered once and never stored — no cookies, no identifiers. The block
renders instantly with placeholders (zero layout shift) and patches values in as
lookups resolve; failures degrade to "unknown".

## Stack

- Vanilla HTML / CSS / JS — no frameworks, no build step, no trackers
- Self-hosted variable fonts (Space Grotesk, JetBrains Mono — 54KB total, no Google Fonts requests)
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
