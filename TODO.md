# TODO — QUEST Landing Redesign (Phase 2)

## Step 1 — Create redesign scaffolding
- [ ] Update/add landing sections to match required order:
  - Sticky Nav (keep component, update styling)
  - Hero (upgrade to editorial + floating 3D angled dashboard mock)
  - Add Pain section (3 trader quote cards)
  - How It Works (implement 4-step numbered vertical timeline)
  - Features (2x2 card grid with richer descriptions)
  - Dashboard Preview cinematic angled browser section
  - Final CTA (black section + waitlist counter)
  - Footer (update socials + copyright to 2026)

## Step 2 — Enforce strict colour + typography system
- [ ] Update `tailwind.config.ts` + `app/globals.css` to the exact palette:
  - Background #080c10, accent #00ff88, secondary #0d9b57, surfaces/borders, headline/body/data colors, danger red
- [ ] Update UI primitives (`Button`, `Card`, Badge if needed) for sharp corners, correct rounding/borders, monospace/data styling
- [ ] Ensure **zero blue/purple** in landing visuals

## Step 3 — Implement section-by-section components
- [ ] `components/landing/Hero.tsx` redesign
- [ ] Create new `components/landing/PainSection.tsx`
- [ ] Create new `components/landing/HowItWorks.tsx`
- [ ] Update `components/landing/FeatureStrip.tsx`
- [ ] Update `components/landing/TradersSection.tsx` into Dashboard preview or split as needed
- [ ] Update `components/landing/WhyQuest.tsx` or replace per spec (including removal/replacement of current shallow card text)
- [ ] Update `components/landing/CtaBanner.tsx` to include "1,200+ traders already in."
- [ ] Update footer socials and copyright

## Step 4 — Wiring & anchors
- [ ] Ensure nav anchors map to real section ids: features, how-it-works, benefits, roadmap, faq (or remove/adjust links to match new sections)

## Step 5 — Validate build
- [ ] Run `npm test` or `npm run lint`/`npm run build` (as appropriate)
- [ ] Spot-check /waitlist page doesn’t break

## Step 6 — Produce deliverable mockup output
- [ ] Render a full desktop high-fidelity landing mockup (implementation should match your spec visually)

