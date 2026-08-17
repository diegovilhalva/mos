import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * footer-containers.png is a shaped cutout (real alpha transparency, not a
 * rectangular photo) — stacked containers across the bottom, transparent
 * above. That's what makes this work with plain z-index stacking: no
 * clip-path/mask is needed the way ThirdReveal needs one for its rectangular
 * photo. Wherever the container graphic is opaque it naturally covers the
 * headline sitting behind it; wherever it's transparent, the headline (and
 * the sky behind that) show straight through.
 */
export default function Footer() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.registerPlugin(CustomEase, ScrollTrigger);

    const context = gsap.context(() => {
      const ease = CustomEase.create('footerEase', '0.21, 0, 0.19, 1');
      const headline = '[data-footer-headline]';

      // yPercent (a share of the headline's own height) rather than a fixed
      // px offset, so the word starts fully tucked behind the containers at
      // every stage size. No opacity fade: the containers do the hiding, so
      // it reads as the word physically rising out from behind them.
      gsap.set(headline, { yPercent: 100 });

      gsap.to(headline, {
        yPercent: 0,
        duration: 1.3,
        ease,
        scrollTrigger: { trigger: root.current, start: 'top 75%', once: true },
      });
    }, root);

    return () => context.revert();
  }, []);

  return (
    <footer className="footer" ref={root}>
      <div className="footer__stage">
        <img className="footer__sky" src="/assets/footer-sky.png" alt="" aria-hidden="true" />
        <h2 className="footer__headline" data-footer-headline>
          Movers
        </h2>
        <img className="footer__containers" src="/assets/footer-containers.png" alt="" aria-hidden="true" />
      </div>
    </footer>
  );
}