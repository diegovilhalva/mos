# MOS — Movers San Antonio

A landing page for a moving and logistics company, built as a single-page, scroll-driven cinematic experience.

**Live:** https://mos-black-seven.vercel.app/
**Repo:** https://github.com/diegovilhalva/mos

## Stack

- **[Astro](https://astro.build/)** — page shell, routing, and selective island hydration
- **React** — interactive components (`client:load` / `client:visible`)
- **[GSAP](https://gsap.com/)** (Core, ScrollTrigger, CustomEase) — all animation orchestration
- **[Lenis](https://lenis.darkroom.engineering/)** — smooth scroll, kept in sync with ScrollTrigger
- **Plain CSS** — no utility framework; a single `global.css`, namespaced per section

## Experience overview

The page is split into one pinned block (`Experience.tsx`) followed by ordinary in-flow sections:

1. **Hero** — headline, stats, and truck animate in on load; a lens effect follows the cursor over the truck; parallax on cursor move.
2. **Pinned scroll, 8 states** (`Experience.tsx`, ~9 viewports of scroll):
   - Truck exits left, hero fades out, "Gamble" copy enters
   - Text dissolves into particles (canvas), a "problems" list appears
   - An orange "About MOS" banner sweeps up to reveal the next section
   - The truck opening its cargo door, rendered as a 145-frame webp sequence scrubbed on canvas (1:1 with scroll — not a `<video>`, which can't track scroll frame-for-frame)
   - Callout hotspots highlighting features over the last frame
   - The truck's own cargo opening becomes a mask (clip-path) that expands to fullscreen, revealing a photo
   - Four feature cards fan up over the photo
   - The first three states snap; scroll is free from there on
3. **Services** — the 4 services offered, with an image preview on hover (desktop)
4. **Testimonials** — two rows of reviews in a pure-CSS marquee (no JS)
5. **Footer** — a headline that rises from behind a cutout of stacked shipping containers

An orange curtain (`Preloader.astro`) covers the screen until fonts and hero assets are ready, synced with `Experience` through a global promise (`window.__mosPreloader`).

## Responsiveness and resilience

- **Below 761px**: the pinned/snapped scroll is replaced by an ordinary stacked flow (no pin, no scrub) — lighter and more predictable on smaller screens.
- **`prefers-reduced-motion: reduce`**: nearly all animation JS is skipped; content renders visible via CSS from the start.
- **No JavaScript**: sections outside `Experience` (Services, Testimonials) only use `gsap.set()` to hide the initial state — the HTML already renders visible, so nothing gets stuck at `opacity: 0` if the script fails.

## Running locally

```bash
npm install
npm run dev
```

## Known gaps

- **CTAs go nowhere**: every quote button (`href="#calculate"`) doesn't yet have a matching section/form on the page.
- **Incomplete nav anchors**: the menu items (`About us`, `Mission`, `Process`, `Projects`) point to ids that don't exist in the current sections.
- **Placeholder reviews**: the testimonials in `TestimonialsSection.tsx` are fictional — the "Straight from Google, unedited" copy needs real reviews before the link goes out publicly.