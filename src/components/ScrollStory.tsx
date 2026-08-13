import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import VapourTextCanvas, { type VapourTextCanvasHandle } from './VapourTextCanvas';

const problems = [
  {
    title: 'Surprise charges',
    description: 'The final bill shouldn’t be higher than the quote.',
    image: '/assets/problem-surprise.png',
    imageClass: 'story__problem-image--surprise',
  },
  {
    title: 'Damaged belongings',
    description: 'Furniture should arrive in the same condition it left.',
    image: '/assets/problem-damage.png',
    imageClass: 'story__problem-image--damage',
  },
  {
    title: 'Unreliable timing',
    description: 'Your moving day should not depend on guesswork.',
    image: '/assets/problem-timing.png',
    imageClass: 'story__problem-image--timing',
  },
];

export default function ScrollStory() {
  const section = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const truck = useRef<HTMLDivElement>(null);
  const phrase = useRef<HTMLDivElement>(null);
  const vapour = useRef<VapourTextCanvasHandle>(null);

  useLayoutEffect(() => {
    if (!section.current || !pin.current || !truck.current || !phrase.current) return;

    gsap.registerPlugin(CustomEase, ScrollTrigger);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      section.current.classList.add('scroll-story--reduced');
      return;
    }

    const context = gsap.context(() => {
      const truckEase = CustomEase.create('storyTruckEase', '0.232, 0, 0.01, 1');
      const textEase = CustomEase.create('storyTextEase', '0.211, 0, 0.01, 1');
      const detailEase = CustomEase.create('storyDetailEase', '0.184, 0.013, 0.01, 1');
      const compactEase = CustomEase.create('storyCompactEase', '0.364, 0, 0, 1');
      const words = gsap.utils.toArray<HTMLElement>('[data-blur-word]');
      const problemItems = gsap.utils.toArray<HTMLElement>('[data-problem]');
      const vapourCanvas = section.current?.querySelector<HTMLElement>('.story__vapour-canvas');
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

      const storyTimeline = gsap.timeline({
        defaults: { overwrite: 'auto' },
        scrollTrigger: {
          trigger: section.current,
          start: 'top top',
          end: () => `+=${Math.max(window.innerHeight * 4.35, 3200)}`,
          pin: pin.current,
          scrub: 0.65,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      storyTimeline
        .to(
          truck.current,
          {
            x: () => getFinalTruckX() * 0.58,
            duration: 1.45,
            ease: truckEase,
          },
          0,
        )
        .to(
          words,
          {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 0.78,
            stagger: 0.075,
            ease: textEase,
          },
          0.2,
        )
        .set(vapourCanvas, { opacity: 1 }, 1.68)
        .set(phrase.current, { opacity: 0 }, 1.68)
        .to(
          vaporState,
          {
            progress: 1,
            duration: 1.14,
            ease: 'none',
            onUpdate: () => vapour.current?.setProgress(vaporState.progress),
          },
          1.68,
        )
        .to(
          truck.current,
          {
            x: () => getFinalTruckX(),
            duration: 1.34,
            ease: truckEase,
          },
          1.62,
        )
        .to(
          problemItems,
          {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 0.76,
            stagger: 0.15,
            ease: detailEase,
          },
          2.68,
        )
        .to({}, { duration: 0.45 });

      const media = gsap.matchMedia();
      media.add('(min-width: 761px)', () => {
        const header = document.querySelector<HTMLElement>('.site-header');
        const nav = header?.querySelector<HTMLElement>('.nav');
        const navLinks = header?.querySelector<HTMLElement>('[data-nav-links]');
        const menuToggle = header?.querySelector<HTMLElement>('[data-menu-toggle]');
        if (!header || !nav || !navLinks || !menuToggle) return;

        const compactTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: section.current,
            start: 'top bottom',
            end: 'top top',
            scrub: 0.65,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              header.classList.toggle('site-header--compact', self.progress > 0.54);
            },
            onLeaveBack: () => header.classList.remove('site-header--compact'),
          },
        });

        compactTimeline
          .to(
            header,
            {
              width: () => Math.min(622, window.innerWidth - 40),
              padding: '7px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.72)',
              borderColor: 'rgba(255, 255, 255, 0.62)',
              boxShadow: '0 18px 52px rgba(0, 10, 60, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.82)',
              backdropFilter: 'blur(18px) saturate(1.18)',
              duration: 1,
              ease: compactEase,
            },
            0,
          )
          .to(nav, { gap: 0, duration: 0.8, ease: compactEase }, 0)
          .to(
            navLinks,
            {
              width: 0,
              y: -7,
              opacity: 0,
              visibility: 'hidden',
              duration: 0.72,
              ease: compactEase,
            },
            0,
          )
          .to(
            menuToggle,
            {
              width: 34,
              opacity: 1,
              visibility: 'visible',
              duration: 0.72,
              ease: compactEase,
            },
            0.18,
          );

        return () => header.classList.remove('site-header--compact');
      });

      return () => media.revert();
    }, section);

    return () => context.revert();
  }, []);

  return (
    <section className="scroll-story" ref={section} aria-labelledby="moving-problems-title">
      <div className="scroll-story__pin" ref={pin}>
        <div className="story__phrase-wrap">
          <div
            className="story__phrase"
            ref={phrase}
            id="moving-problems-title"
            aria-label="Moving shouldn’t feel like a gamble"
          >
            <span className="story__phrase-line" aria-hidden="true">
              <span data-blur-word>Moving</span>{' '}
              <span data-blur-word>shouldn’t</span>
            </span>
            <span className="story__phrase-line" aria-hidden="true">
              <span data-blur-word>feel</span>{' '}
              <span data-blur-word>like</span>{' '}
              <span className="story__phrase-emphasis" data-blur-word>a</span>{' '}
              <span className="story__phrase-emphasis" data-blur-word>Gamble</span>
            </span>
          </div>
          <VapourTextCanvas ref={vapour} />
        </div>

        <div className="story__truck" ref={truck} aria-hidden="true">
          <img className="story__truck-shadow" src="/assets/truck-shadow.svg" alt="" />
          <img className="story__truck-image" src="/assets/truck.png" alt="" />
        </div>

        <div className="story__problems" aria-label="Common moving problems">
          {problems.map((problem) => (
            <article className="story__problem" data-problem key={problem.title}>
              <div className={`story__problem-image ${problem.imageClass}`}>
                <img src={problem.image} alt="" />
              </div>
              <div className="story__problem-copy">
                <h3>{problem.title}</h3>
                <p>{problem.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}