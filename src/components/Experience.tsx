import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import SiteHeader from './SiteHeader';
import HeroStage from './HeroStage';
import StoryPanels from './StoryPanels';
import ThirdReveal, { HOTSPOTS, FRAME_W, FRAME_H, DOOR } from './ThirdReveal';
import type { VapourTextCanvasHandle } from './VapourTextCanvas';

/**
 * Four states, three transitions, one truck.
 *
 *   state 0 (t = 0)    hero at rest                          snapped
 *   state 1 (t = 1)    truck far left, hero gone, "Gamble"    snapped
 *   state 2 (t = 2)    phrase vapourised, "Problems" resolved snapped
 *   state 3 (t = 4.5)  video fullscreen and played out        FREE SCROLL
 *   state 4 (t = 5.5)  hotspot callouts drawn over last frame FREE SCROLL
 *   state 5 (t = 6)    blacked out to the cargo door, photo   FREE SCROLL
 *                      up inside it
 *   state 6 (t = 8)    door opened out to a fullscreen image  FREE SCROLL
 *
 * Snapping deliberately stops at state 2. Past it everything is ordinary
 * scrolling, so the page starts feeling like a normal page.
 *
 * Transitions A and B are one unit each. C runs 2 -> 4.5 and overlaps two
 * things: the banner sweeps 2 -> 3.5 (a viewport plus its own height, roughly
 * 1:1 with the wheel), while the video scrubs and opens out across the whole
 * 2 -> 4.5, so it lands fullscreen exactly on its last frame.
 *
 * D (5.5 -> 8) uses the truck's own cargo opening as a mask: black washes in
 * around it while the photo comes up inside it — one beat, not two — and then
 * the opening grows out to fullscreen while the photo underneath holds still.
 *
 * Every tween inside a SNAPPED transition MUST finish before the next boundary,
 * or a "fixed" state would still be moving when the snap settles.
 */

const TIMELINE_UNITS = 8;

/** Video runs the full length of transition C. */
const VIDEO_SPAN = 2.5;

/** Frames in public/assets/frames — the 6s / 24fps source, one file each. */
const FRAME_COUNT = 145;

/** Only states 0-2 snap; state 3 is reached by free scrolling. */
const SNAP_STOPS = [0, 1 / TIMELINE_UNITS, 2 / TIMELINE_UNITS];

/** Above this progress the snap disengages entirely. */
const FREE_SCROLL_FROM = SNAP_STOPS[2];

export default function Experience() {
  const experience = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const truck = useRef<HTMLDivElement>(null);
  const containerHitbox = useRef<HTMLDivElement>(null);
  const phrase = useRef<HTMLDivElement>(null);
  const vapour = useRef<VapourTextCanvasHandle>(null);

  const lensInside = useRef(false);
  const lensRevealDelay = useRef<gsap.core.Tween | null>(null);
  const lensEase = useRef<ReturnType<typeof CustomEase.create> | null>(null);
  const lensEnabled = useRef(true);

  useLayoutEffect(() => {
    if (!experience.current || !pin.current || !truck.current || !phrase.current) return;

    gsap.registerPlugin(CustomEase, ScrollTrigger);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      experience.current.classList.add('experience--reduced');
      return;
    }

    // A pinned, snapped page must always start at state 0.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    lenis.stop();
    let scrollReleased = false;
    const releaseScroll = () => {
      if (scrollReleased) return;
      scrollReleased = true;
      lenis.start();
    };

    let introSafety = 0;

    const context = gsap.context(() => {
      const navbarEase = CustomEase.create('navbarEase', '0.364, 0, 0, 1');
      const moversEase = CustomEase.create('moversEase', '0.211, 0, 0.01, 1');
      const locationEase = CustomEase.create('locationEase', '0.207, 0, 0.01, 1');
      const statsEase = CustomEase.create('statsEase', '0.184, 0.013, 0.01, 1');
      const truckEase = CustomEase.create('truckEase', '0.232, 0, 0.01, 1');
      const cssEaseOut = CustomEase.create('cssEaseOut', '0, 0, 0.58, 1');
      const textEase = CustomEase.create('storyTextEase', '0.211, 0, 0.01, 1');
      const detailEase = CustomEase.create('storyDetailEase', '0.184, 0.013, 0.01, 1');
      const exitEase = CustomEase.create('storyExitEase', '0.5, 0, 0.75, 0');
      lensEase.current = CustomEase.create('lensEase', '0.232, 0, 0.01, 1');

      const words = gsap.utils.toArray<HTMLElement>('[data-blur-word]');
      const problemItems = gsap.utils.toArray<HTMLElement>('[data-problem]');
      const vapourCanvas = experience.current?.querySelector<HTMLElement>('.story__vapour-canvas');
      if (!vapourCanvas) return;

      gsap.set(words, { y: 24, opacity: 0, filter: 'blur(16px)' });
      gsap.set(problemItems, { y: 30, opacity: 0, filter: 'blur(14px)' });
      gsap.set(vapourCanvas, { opacity: 0 });
      vapour.current?.setProgress(0);

      const vaporState = { progress: 0 };
      const getFinalTruckX = () => {
        if (!truck.current || !pin.current) return -1100;
        const initialLeft = Number.parseFloat(getComputedStyle(truck.current).left) || 0;
        const finalRightEdge = pin.current.clientWidth >= 761 ? pin.current.clientWidth * 0.363 : 0;
        return finalRightEdge - truck.current.offsetWidth - initialLeft;
      };

      const media = gsap.matchMedia();

      /* --------------------------------------------------------------- scenes */

      /**
       * Built only once the intro has finished, and that ordering is load-bearing.
       *
       * The intro's `.from()` tweens render immediately, so at mount "Movers" is
       * already parked at yPercent 110. A scrubbed timeline records its start
       * values the first time it renders — which is the moment it is created.
       * Build it any earlier and it captures 110 as the resting pose, snapping
       * the headline out of its clipping mask on the first scroll and pinning it
       * there at progress 0 forever.
       *
       * Deferring is safe: until the pin spacer exists the page is exactly one
       * viewport tall, so there is nothing to scroll anyway.
       */
      let scenesBuilt = false;
      const buildScrollScenes = () => {
        if (scenesBuilt) return;
        scenesBuilt = true;

        media.add('(min-width: 761px)', () => {
          const header = document.querySelector<HTMLElement>('.site-header');

          // Whether the pending snap is a real one, and whether we actually
          // parked Lenis for it. Tracked separately so a zone change between
          // onStart and onComplete can never strand Lenis stopped.
          let wantsSnap = true;
          let lenisParked = false;
          let cleanupCanvas: (() => void) | null = null;

          const states = gsap.timeline({
            defaults: { overwrite: 'auto' },
            scrollTrigger: {
              trigger: experience.current,
              start: 'top top',
              end: () => `+=${window.innerHeight * TIMELINE_UNITS}`,
              pin: pin.current,
              scrub: 0.6,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              snap: {
                // Snap only while the hero story is running. Past state 2 the
                // banner sweep is plain scrolling, so hand control back: return
                // the value untouched and ScrollTrigger leaves it alone.
                snapTo: (value) => {
                  if (value > FREE_SCROLL_FROM) {
                    wantsSnap = false;
                    return value;
                  }
                  wantsSnap = true;
                  return SNAP_STOPS.reduce((closest, stop) =>
                    Math.abs(stop - value) < Math.abs(closest - value) ? stop : closest,
                  );
                },
                duration: { min: 0.4, max: 0.9 },
                delay: 0.05,
                directional: true,
                ease: 'power2.inOut',
                // ScrollTrigger's snap tweens window scroll directly. A live Lenis
                // RAF loop fights that and jitters, so park it for the duration.
                // In the free zone we must NOT park it — lenis.stop() resets its
                // internal scroll and would kill the user's momentum mid-flick.
                onStart: () => {
                  if (!wantsSnap) return;
                  lenis.stop();
                  lenisParked = true;
                },
                onComplete: () => {
                  if (!lenisParked) return;
                  lenis.start();
                  lenisParked = false;
                },
                onInterrupt: () => {
                  if (!lenisParked) return;
                  lenis.start();
                  lenisParked = false;
                },
              },
              onUpdate: (self) => {
                // Compaction is a plain class toggle so CSS owns the transition.
                header?.classList.toggle('site-header--compact', self.progress > 0.05);

                // The lens only makes sense while the truck sits on its hero mark.
                const atRest = self.progress < 0.001;
                if (atRest === lensEnabled.current) return;

                lensEnabled.current = atRest;
                if (!atRest) hideTruckLens();
              },
            },
          });

          /* --- transition A (t 0 -> 1): truck left, hero out, "Gamble" in --- */
          states
            .to(truck.current, { x: () => getFinalTruckX(), duration: 1, ease: truckEase }, 0)
            .to('[data-animate="headline"]', { yPercent: -120, duration: 0.5, ease: exitEase }, 0)
            .to('[data-animate="location"]', { yPercent: -120, duration: 0.5, ease: exitEase }, 0.04)
            .to('[data-animate="stats"]', { y: -28, opacity: 0, duration: 0.45, ease: exitEase }, 0.06)
            .to(
              '[data-animate="showreel"]',
              { scale: 0.72, opacity: 0, duration: 0.42, ease: exitEase },
              0.06,
            )
            .to('[data-animate="cta"]', { y: -20, opacity: 0, duration: 0.42, ease: exitEase }, 0.08)
            // 6 words: 0.38 + 5 * 0.04 + 0.4 = 0.98, settled before the state-1 stop.
            .to(
              words,
              { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.4, stagger: 0.04, ease: textEase },
              0.38,
            )

            /* --- transition B (t 1 -> 2): vapour out, "Problems" in --- */
            .set(vapourCanvas, { opacity: 1 }, 1)
            .set(phrase.current, { opacity: 0 }, 1)
            .to(
              vaporState,
              {
                progress: 1,
                duration: 0.62,
                ease: 'none',
                onUpdate: () => vapour.current?.setProgress(vaporState.progress),
              },
              1,
            )
            // 3 items: 1.26 + 2 * 0.09 + 0.52 = 1.96, settled before the state-2 stop.
            .to(
              problemItems,
              {
                y: 0,
                opacity: 1,
                filter: 'blur(0px)',
                duration: 0.52,
                stagger: 0.09,
                ease: detailEase,
              },
              1.26,
            )
            .to({}, { duration: 0.04 });

          /* --- transition C (t 2 -> 3): banner sweeps up, third section behind --- */
          // The banner parks at `top: 100%`, i.e. flush under the pin, so its
          // resting transform is 0 and no initial gsap.set is needed.
          const banner = experience.current?.querySelector<HTMLElement>('[data-banner]');
          const third = experience.current?.querySelector<HTMLElement>('[data-third]');

          if (banner && third) {
            // Third section is uncovered by the banner's trailing edge: clip it
            // to everything the banner has already swept past. Driven off the
            // banner's live transform so the two can never drift apart.
            const revealThird = () => {
              const pinHeight = pin.current?.clientHeight ?? window.innerHeight;
              const bannerTop = pinHeight + (gsap.getProperty(banner, 'y') as number);
              const swept = bannerTop + banner.offsetHeight;
              third.style.clipPath = `inset(${Math.min(Math.max(swept, 0), pinHeight)}px 0 0 0)`;
            };

            states.to(
              banner,
              {
                y: () => -((pin.current?.clientHeight ?? window.innerHeight) + banner.offsetHeight),
                duration: 1.5,
                // Linear on purpose: in the free-scroll zone the banner should
                // track the wheel 1:1. An eased sweep reads as lag here.
                ease: 'none',
                onUpdate: revealThird,
              },
              2,
            );
          }

          /* --- frames: scrub and open out across the whole of transition C --- */
          const canvas = experience.current?.querySelector<HTMLCanvasElement>('[data-third-canvas]');
          const ctx = canvas?.getContext('2d', { alpha: false });

          if (canvas && ctx) {
            const frames: Array<HTMLImageElement | undefined> = new Array(FRAME_COUNT);
            let drawnFrame = -1;

            const drawFrame = (index: number) => {
              // Until a frame has arrived, hold on the nearest one that has.
              let image = frames[index];
              for (let step = 1; !image && step < FRAME_COUNT; step += 1) {
                image = frames[index - step] ?? frames[index + step];
              }
              if (!image) return;

              // Canvas has no object-fit, so cover-fit by hand.
              const { width, height } = canvas;
              const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
              const w = image.naturalWidth * scale;
              const h = image.naturalHeight * scale;
              ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
            };

            const sizeCanvas = () => {
              const dpr = Math.min(window.devicePixelRatio || 1, 2);
              const w = Math.round(canvas.clientWidth * dpr);
              const h = Math.round(canvas.clientHeight * dpr);
              if (!w || !h || (canvas.width === w && canvas.height === h)) return;
              canvas.width = w;
              canvas.height = h;
              if (drawnFrame >= 0) drawFrame(drawnFrame);
            };

            // The drawn frame's rect inside the canvas box — the same cover fit
            // drawFrame does, expressed in layout pixels. Anything anchored to
            // the footage has to go through this, or it slides off the truck at
            // any aspect other than 16:9.
            const frameRect = () => {
              const cw = canvas.clientWidth;
              const ch = canvas.clientHeight;
              const scale = Math.max(cw / FRAME_W, ch / FRAME_H);
              const w = FRAME_W * scale;
              const h = FRAME_H * scale;
              return { left: (cw - w) / 2, top: (ch - h) / 2, w, h };
            };

            // Fetched in the background while the visitor is still in the hero,
            // so the ~5MB never competes with first paint. Several chains at
            // once, but in order, so the opening frames land first.
            let nextToLoad = 0;
            const loadNext = () => {
              if (nextToLoad >= FRAME_COUNT) return;
              const index = nextToLoad;
              nextToLoad += 1;

              const image = new Image();
              image.src = `/assets/frames/frame-${String(index + 1).padStart(3, '0')}.webp`;
              // decode() off the main thread, so the first draw never stalls.
              image
                .decode()
                .then(() => {
                  frames[index] = image;
                  if (index === drawnFrame || drawnFrame < 0) drawFrame(Math.max(drawnFrame, 0));
                })
                .catch(() => {})
                .finally(loadNext);
            };
            for (let chain = 0; chain < 6; chain += 1) loadNext();

            sizeCanvas();
            window.addEventListener('resize', sizeCanvas);

            const playhead = { progress: 0 };
            const renderPlayhead = () => {
              sizeCanvas();
              const frame = Math.round(playhead.progress * (FRAME_COUNT - 1));
              if (frame === drawnFrame) return;
              drawnFrame = frame;
              drawFrame(frame);
            };

            states
              .to(
                playhead,
                { progress: 1, duration: VIDEO_SPAN, ease: 'none', onUpdate: renderPlayhead },
                2,
              )
              .fromTo(
                canvas,
                { clipPath: 'inset(25% 25% 25% 25% round 16px)' },
                {
                  clipPath: 'inset(0% 0% 0% 0% round 0px)',
                  duration: VIDEO_SPAN,
                  ease: 'none',
                  immediateRender: false,
                },
                2,
              );

            // Everything this branch has to undo on a matchMedia revert. GSAP's
            // context tracks its own tweens but knows nothing about listeners or
            // styles written by hand in an onUpdate.
            const undo: Array<() => void> = [
              () => window.removeEventListener('resize', sizeCanvas),
            ];
            cleanupCanvas = () => undo.forEach((fn) => fn());

            /* --- hotspots: fire once the last frame lands (t 4.5 -> 5.5) --- */
            const layer = experience.current?.querySelector<HTMLElement>('[data-hotspots]');
            const dots = gsap.utils.toArray<HTMLElement>('[data-hotspot-dot]');
            const labels = gsap.utils.toArray<HTMLElement>('[data-hotspot-label]');
            const lines = gsap.utils.toArray<HTMLElement>('[data-hotspot-line]');

            if (layer && dots.length === HOTSPOTS.length) {
              gsap.set([...dots, ...labels], { xPercent: -50, yPercent: -50 });

              // Sit the layer exactly over the drawn frame, so the % anchors
              // inside it hit real pixels.
              const layoutHotspots = () => {
                if (!canvas.clientWidth || !canvas.clientHeight) return;

                const { left, top, w, h } = frameRect();
                layer.style.left = `${left}px`;
                layer.style.top = `${top}px`;
                layer.style.width = `${w}px`;
                layer.style.height = `${h}px`;

                // Each connector runs dot-centre -> label-centre. Only width and
                // rotation are set here; scaleX stays owned by the reveal tween.
                HOTSPOTS.forEach((hotspot, index) => {
                  const dx = ((hotspot.label.x - hotspot.dot.x) / 100) * w;
                  const dy = ((hotspot.label.y - hotspot.dot.y) / 100) * h;
                  const line = lines[index];
                  line.style.left = `${(hotspot.dot.x / 100) * w}px`;
                  line.style.top = `${(hotspot.dot.y / 100) * h}px`;
                  gsap.set(line, {
                    width: Math.hypot(dx, dy),
                    rotation: (Math.atan2(dy, dx) * 180) / Math.PI,
                    transformOrigin: '0 50%',
                  });
                });
              };

              layoutHotspots();
              window.addEventListener('resize', layoutHotspots);
              undo.push(() => window.removeEventListener('resize', layoutHotspots));

              const reveal = gsap.timeline();
              HOTSPOTS.forEach((_, index) => {
                const at = index * 0.16;
                reveal
                  .fromTo(
                    dots[index],
                    { scale: 0.2, opacity: 0 },
                    { scale: 1, opacity: 1, duration: 0.26, ease: 'back.out(2)' },
                    at,
                  )
                  .fromTo(
                    lines[index],
                    { scaleX: 0, opacity: 1 },
                    { scaleX: 1, duration: 0.3, ease: 'power2.out' },
                    at + 0.12,
                  )
                  .fromTo(
                    labels[index],
                    { opacity: 0, y: 8 },
                    { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' },
                    at + 0.3,
                  );
              });

              // Natural length is 3 * 0.16 + 0.3 + 0.28 = 1.06; normalising to 1
              // fits the reveal to the 4.5 -> 5.5 window exactly, so it is fully
              // settled at the end of the timeline whatever the stagger becomes.
              states.add(reveal.totalDuration(1), 4.5);
            }

            /* --- transition D (t 5.5 -> 8): the cargo door becomes a mask --- */
            const shade = experience.current?.querySelector<HTMLElement>('[data-third-shade]');
            const photo = experience.current?.querySelector<HTMLElement>('[data-third-reveal]');

            if (shade && photo) {
              const mask = { open: 0 };

              const renderMask = () => {
                const cw = canvas.clientWidth;
                const ch = canvas.clientHeight;
                if (!cw || !ch) return;

                // The door rect in canvas pixels at open = 0, eased out to the
                // whole canvas box at open = 1. Scaling each edge by (1 - open)
                // is what walks it to inset(0) on every side at once.
                const rect = frameRect();
                const rest = 1 - mask.open;
                const l = (rect.left + (DOOR.x / 100) * rect.w) * rest;
                const t = (rect.top + (DOOR.y / 100) * rect.h) * rest;
                const r = (cw - (rect.left + ((DOOR.x + DOOR.w) / 100) * rect.w)) * rest;
                const b = (ch - (rect.top + ((DOOR.y + DOOR.h) / 100) * rect.h)) * rest;

                photo.style.clipPath = `inset(${t}px ${r}px ${b}px ${l}px)`;

                // Outer box, then a bridge in to trace the hole and back out —
                // the standard way to punch a hole with a single polygon. Same
                // four edges as the inset above.
                const x1 = cw - r;
                const y1 = ch - b;
                shade.style.clipPath =
                  `polygon(0 0, 0 100%, ${l}px 100%, ${l}px ${t}px, ${x1}px ${t}px, ` +
                  `${x1}px ${y1}px, ${l}px ${y1}px, ${l}px 100%, 100% 100%, 100% 0)`;
              };

              renderMask();
              // Only the scrub redraws this, so a resize while parked mid-zoom
              // would otherwise leave the window at its old size.
              window.addEventListener('resize', renderMask);
              undo.push(() => {
                window.removeEventListener('resize', renderMask);
                shade.style.clipPath = '';
                photo.style.clipPath = '';
              });

              states
                // One beat, not two: the black washes in around the opening at
                // the same time as the photo comes up inside it, so it reads as
                // the screen going dark ON the photo rather than a blackout
                // followed by a separate reveal. Both linear and the same
                // length, so they stay locked to each other through a scrub.
                .to(shade, { opacity: 1, duration: 0.5, ease: 'none' }, 5.5)
                .to(photo, { opacity: 1, duration: 0.5, ease: 'none' }, 5.5)
                // The window opens out; the photo underneath never moves.
                .to(
                  mask,
                  { open: 1, duration: 2, ease: 'power2.inOut', onUpdate: renderMask },
                  6,
                );

              if (layer) states.to(layer, { opacity: 0, duration: 0.3, ease: 'power2.out' }, 5.5);
            }
          }

          return () => {
            header?.classList.remove('site-header--compact');
            if (third) third.style.clipPath = '';
            cleanupCanvas?.();
            lensEnabled.current = true;
          };
        });

        // Below 761px the hero stage is 940px tall against a ~750px viewport, so
        // it cannot share one clipped 100dvh pin with the story. Stack instead.
        media.add('(max-width: 760px)', () => {
          lensEnabled.current = true;

          // No scrub down here, so the video plays itself as ambient loop.
          const video = experience.current?.querySelector<HTMLVideoElement>('[data-third-video]');
          if (video) {
            video.muted = true;
            video.loop = true;
            void video.play().catch(() => {});
          }

          const revealWords = gsap.to(words, {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 0.72,
            stagger: 0.06,
            ease: textEase,
            scrollTrigger: { trigger: '.story__phrase-wrap', start: 'top 82%', once: true },
          });

          const revealProblems = gsap.to(problemItems, {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 0.7,
            stagger: 0.12,
            ease: detailEase,
            scrollTrigger: { trigger: '.story__problems', start: 'top 84%', once: true },
          });

          return () => {
            video?.pause();
            revealWords.scrollTrigger?.kill();
            revealProblems.scrollTrigger?.kill();
          };
        });

        ScrollTrigger.refresh();
      };

      /* --------------------------------------------------------------- wheels */
      /**
       * Spin is derived from the truck's own translation every frame, rather
       * than tweened alongside it. A parallel rotation tween would need to match
       * the truck's ease, duration and position exactly or the wheels would
       * visibly slip against the ground; reading the live transform makes that
       * impossible by construction, and reverse-scroll spin comes free.
       *
       * Radii are fractions of the truck's width, so distance and radius scale
       * together and the revolution count holds at every breakpoint.
       */
      type Spinner = (travelled: number, truckWidth: number) => void;

      const spinners: Spinner[] = (
        [
          { key: 'front', radiusRatio: 0.047807 },
          { key: 'rear-1', radiusRatio: 0.045989 },
          { key: 'rear-2', radiusRatio: 0.048824 },
        ] as const
      ).flatMap(({ key, radiusRatio }) => {
        const el = experience.current?.querySelector<HTMLElement>(`[data-wheel="${key}"]`);
        if (!el) return [];
        const setRotation = gsap.quickSetter(el, 'rotation', 'deg');
        return [
          (travelled: number, truckWidth: number) => {
            const circumference = 2 * Math.PI * radiusRatio * truckWidth;
            if (circumference) setRotation((travelled / circumference) * 360);
          },
        ];
      });

      let lastTravelled: number | null = null;
      const spinWheels = () => {
        if (!truck.current || !spinners.length) return;

        const width = truck.current.offsetWidth;
        // The intro drives xPercent while the scroll timeline drives x, so the
        // real distance covered is the sum of both channels.
        const travelled =
          (gsap.getProperty(truck.current, 'x') as number) +
          ((gsap.getProperty(truck.current, 'xPercent') as number) / 100) * width;

        if (travelled === lastTravelled) return;
        lastTravelled = travelled;
        for (const spin of spinners) spin(travelled, width);
      };

      gsap.ticker.add(spinWheels);

      /* ---------------------------------------------------------------- intro */

      const intro = gsap.timeline();

      intro
        .from('[data-animate="header"]', { y: -24, opacity: 0, duration: 0.5001, ease: navbarEase }, 0)
        .from(truck.current, { xPercent: 60, duration: 1.6044, ease: truckEase }, 0)
        .from('[data-animate="headline"]', { yPercent: 110, duration: 1.0161, ease: moversEase }, 0.7566)
        .from('[data-animate="location"]', { yPercent: 110, duration: 0.9864, ease: locationEase }, 0.933)
        .from('[data-animate="stats"]', { y: 22, opacity: 0, duration: 0.9345, ease: statsEase }, 1.7841)
        .from(
          '[data-animate="showreel"]',
          { scale: 0.72, opacity: 0, rotate: -35, duration: 0.864, ease: cssEaseOut },
          1.7979,
        )
        .eventCallback('onComplete', () => {
          buildScrollScenes();
          releaseScroll();
        });

      introSafety = window.setTimeout(() => {
        buildScrollScenes();
        releaseScroll();
      }, 4200);

      gsap.to('[data-animate="showreel-image"]', {
        rotate: 360,
        duration: 18,
        ease: 'none',
        repeat: -1,
      });

      /* ----------------------------------------------------------------- lens */
      // Sole remaining job: catch a pointer that leaves the truck hitbox faster
      // than its own pointerleave fires.

      const onPointerMove = (event: PointerEvent) => {
        if (!lensInside.current) return;

        const bounds = containerHitbox.current?.getBoundingClientRect();
        const outsideContainer =
          !bounds ||
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom;

        if (outsideContainer) hideTruckLens();
      };

      window.addEventListener('pointermove', onPointerMove, { passive: true });

      return () => {
        window.removeEventListener('pointermove', onPointerMove);
        gsap.ticker.remove(spinWheels);
        media.revert();
      };
    }, experience);

    return () => {
      window.clearTimeout(introSafety);
      gsap.ticker.remove(raf);
      lenis.destroy();
      context.revert();
    };
  }, []);

  /* ------------------------------------------------------------------- lens */

  const activateTruckLens = () => {
    if (!truck.current) return;

    truck.current.classList.add('truck--lens-active');
    gsap.fromTo(
      truck.current,
      {
        '--lens-core': '0px',
        '--lens-edge': '0px',
        '--pressure-inner': '0px',
        '--pressure-outer': '0px',
      },
      {
        '--lens-core': '72px',
        '--lens-edge': '88px',
        '--pressure-inner': '76px',
        '--pressure-outer': '124px',
        duration: 0.72,
        ease: lensEase.current ?? 'power3.out',
        overwrite: 'auto',
      },
    );
  };

  const queueTruckLens = () => {
    if (lensInside.current) return;

    lensInside.current = true;
    lensRevealDelay.current?.kill();
    lensRevealDelay.current = gsap.delayedCall(0.16, () => {
      if (lensInside.current) activateTruckLens();
    });
  };

  const positionTruckLens = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!truck.current || !lensEnabled.current) return;

    queueTruckLens();
    const bounds = truck.current.getBoundingClientRect();
    gsap.to(truck.current, {
      '--lens-x': `${event.clientX - bounds.left}px`,
      '--lens-y': `${event.clientY - bounds.top}px`,
      duration: 0.14,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  };

  const showTruckLens = (event: React.PointerEvent<HTMLDivElement>) => {
    positionTruckLens(event);
  };

  const hideTruckLens = () => {
    if (!truck.current) return;

    lensInside.current = false;
    lensRevealDelay.current?.kill();
    lensRevealDelay.current = null;
    truck.current.classList.remove('truck--lens-active');
  };

  return (
    <>
      <SiteHeader />
      <section className="experience" ref={experience} aria-labelledby="moving-problems-title">
        <div className="experience__pin" ref={pin}>
          <HeroStage
            truckRef={truck}
            hitboxRef={containerHitbox}
            onLensEnter={showTruckLens}
            onLensMove={positionTruckLens}
            onLensLeave={hideTruckLens}
          />
          <StoryPanels phraseRef={phrase} vapourRef={vapour} />
          <ThirdReveal />
        </div>
      </section>
    </>
  );
}