import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';


type Review = {
  name: string;
  initials: string;
  timeAgo: string;
  rating: number;
  text: string;
};

/**
 * Placeholder copy, not real customer reviews — swap in genuine Google reviews
 * before launch. Each line echoes one of the pain points raised earlier in
 * the page (surprise charges, damaged belongings, unreliable timing), so the
 * section reads as those problems resolved rather than generic praise.
 */


const rowA: Review[] = [
  {
    name: 'Marcus Webb',
    initials: 'MW',
    timeAgo: '2 weeks ago',
    rating: 5,
    text: 'Quoted $850, billed $850. First movers who didn’t pad the invoice at the door.',
  },
  {
    name: 'Elena Ruiz',
    initials: 'ER',
    timeAgo: '1 month ago',
    rating: 5,
    text: 'Piano, glass cabinet, everything arrived without a scratch. Genuinely careful crew.',
  },
  {
    name: 'Daniel Frost',
    initials: 'DF',
    timeAgo: '3 days ago',
    rating: 5,
    text: 'Truck showed up inside the 15-minute window they gave us. Didn’t think that was possible.',
  },
  {
    name: 'Sarah Chen',
    initials: 'SC',
    timeAgo: 'a month ago',
    rating: 5,
    text: 'Corporate relocation for 40 desks, done overnight with zero downtime the next morning.',
  },
];

const rowB: Review[] = [
  {
    name: 'Amelia Park',
    initials: 'AP',
    timeAgo: '2 months ago',
    rating: 5,
    text: 'No hidden fees, no last-minute upcharges. Exactly what was quoted, down to the dollar.',
  },
  {
    name: 'James Okonkwo',
    initials: 'JO',
    timeAgo: '1 week ago',
    rating: 5,
    text: 'Cross-state move and everything tracked in real time. Never once wondered where our stuff was.',
  },
  {
    name: 'Priya Nair',
    initials: 'PN',
    timeAgo: '3 weeks ago',
    rating: 5,
    text: 'Packed our kitchen better than we would have ourselves. Not a single chipped plate.',
  },
  {
    name: 'Tom Alvarez',
    initials: 'TA',
    timeAgo: '5 days ago',
    rating: 4,
    text: 'Booked two days out during a move deadline and they still made it on time.',
  },
];

/** Rotates through a small set of brand-derived tints for the initials avatars. */
const avatarTints = ['#000a3c', '#ff5a33', '#2c3e7a', '#0a0a0a'];

function GoogleMark() {
  return (
    <svg className="testimonial-card__google" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z"
      />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.17.29-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03Z" />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58Z"
      />
    </svg>
  );

}


function StarRow({ rating }: { rating: number }) {
  return (
    <div className="testimonial-card__stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={i < rating ? 'testimonial-star testimonial-star--filled' : 'testimonial-star'}
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M10 1.5l2.59 5.25 5.79.84-4.19 4.08.99 5.77L10 14.77l-5.18 2.67.99-5.77-4.19-4.08 5.79-.84L10 1.5Z" />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const tint = avatarTints[review.initials.charCodeAt(0) % avatarTints.length];
  return (
    <article className="testimonial-card">
      <div className="testimonial-card__head">
        <span className="testimonial-card__avatar" style={{ background: tint }} aria-hidden="true">
          {review.initials}
        </span>
        <span className="testimonial-card__who">
          <span className="testimonial-card__name">{review.name}</span>
          <span className="testimonial-card__time">{review.timeAgo}</span>
        </span>
        <GoogleMark />
      </div>
      <StarRow rating={review.rating} />
      <p className="testimonial-card__text">{review.text}</p>
    </article>
  );
}

/** One row's track: the set rendered twice so the loop point is invisible. */
function MarqueeRow({ reviews, duration, fast }: { reviews: Review[]; duration: string; fast?: boolean }) {
  return (
    <div className={fast ? 'testimonial-row testimonial-row--fast' : 'testimonial-row'}>
      <div className="testimonial-track" style={{ '--marquee-duration': duration } as CSSProperties}>
        <div className="testimonial-set">
          {reviews.map((review) => (
            <ReviewCard review={review} key={review.name} />
          ))}
        </div>
        <div className="testimonial-set" aria-hidden="true">
          {reviews.map((review) => (
            <ReviewCard review={review} key={`${review.name}-dup`} />
          ))}
        </div>
      </div>
    </div>
  );
}


/**
 * Two rows of Google-styled review cards, auto-scrolling left-to-right on a
 * pure CSS transform loop (see .testimonial-track in global.css) — no JS is
 * needed for the marquee itself, only for the eyebrow/heading reveal, which
 * follows the same gsap.set()-then-reveal pattern as ServicesSection so the
 * section still renders fully visible with JavaScript off.
 */
export default function TestimonialsSection() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.registerPlugin(CustomEase, ScrollTrigger);

    const context = gsap.context(() => {
      const ease = CustomEase.create('testimonialsEase', '0.21, 0, 0.19, 1');
      const eyebrow = '[data-testimonials-eyebrow]';
      const lines = gsap.utils.toArray<HTMLElement>('[data-testimonials-line]');
      const sub = '[data-testimonials-sub]';

      gsap.set(eyebrow, { yPercent: 60, opacity: 0 });
      gsap.set(lines, { yPercent: 110 });
      gsap.set(sub, { y: 16, opacity: 0 });

      gsap
        .timeline({ scrollTrigger: { trigger: root.current, start: 'top 72%', once: true } })
        .to(eyebrow, { yPercent: 0, opacity: 1, duration: 0.6, ease })
        .to(lines, { yPercent: 0, duration: 0.85, stagger: 0.08, ease }, 0.05)
        .to(sub, { y: 0, opacity: 1, duration: 0.55, ease }, 0.3);
    }, root);

    return () => context.revert();
  }, []);

  return (
    <section className="testimonials" id="testimonials" ref={root} aria-labelledby="testimonials-title">
      <div className="testimonials__intro">
        <p className="testimonials__eyebrow-mask">
          <span data-testimonials-eyebrow>
            <svg className="testimonials__mark" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M2 10 L8 1 L10 3 L4 11 Z" fill="currentColor" />
            </svg>
            Reviews
          </span>
        </p>

        <h2 className="testimonials__title" id="testimonials-title">
          <span className="testimonials__line-mask">
            <span data-testimonials-line>We Are #1 Rated Moving Service</span>
          </span>
        </h2>

        <p className="testimonials__sub" data-testimonials-sub>
          Straight from Google, unedited.
        </p>
      </div>

      <div className="testimonials__rows" role="region" aria-label="Customer reviews">
        <MarqueeRow reviews={rowA} duration="42s" />
        <MarqueeRow reviews={rowB} duration="28s" fast />
      </div>
    </section>
  );
}