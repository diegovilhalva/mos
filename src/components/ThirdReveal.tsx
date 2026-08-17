import { Fragment, type CSSProperties } from 'react';

/**
 * Anchors are percentages of the VIDEO FRAME, not of the viewport.
 *
 * The frame is cover-fitted, so the two only coincide at 16:9 — at any other
 * aspect the sides or top get cropped and viewport percentages would slide off
 * the truck. Experience.tsx sizes the overlay to the drawn frame rect, which
 * makes these stick to the pixels they were measured against.
 *
 * Derived from the Figma mock by converting its 1280x832 coordinates back
 * through the same cover fit.
 */
export const HOTSPOTS = [
  { title: ['On time', 'Delivery'], dot: { x: 59.26, y: 36.66 }, label: { x: 63.52, y: 26.68 } },
  { title: ['Guaranteed', 'Security'], dot: { x: 43.85, y: 54.33 }, label: { x: 34.25, y: 47.24 } },
  { title: ['24/7', 'Support'], dot: { x: 55.61, y: 61.66 }, label: { x: 64.06, y: 55.89 } },
  { title: ['Real time', 'tracking'], dot: { x: 50.0, y: 69.71 }, label: { x: 41.55, y: 80.17 } },
];

/** Intrinsic size of a frame, used to reproduce the canvas cover fit in layout. */
export const FRAME_W = 1440;
export const FRAME_H = 810;

/**
 * The cargo opening in the last frame, in the same frame-percentage space as
 * HOTSPOTS — bounded by the top rail, the two open door panels and the bed
 * floor. Its centre lands at 50.4% / 51.7%, so the mask that grows out of it
 * reads as a zoom from the middle of the screen.
 */
export const DOOR = { x: 42.71, y: 37.78, w: 15.28, h: 27.9 };

/**
 * The four cards that rise over the photo, in the order they land.
 *
 * Fan offsets are percentages of the CARD's own size rather than the viewport,
 * so the stack keeps its shape whatever the cards measure. They are centred on
 * zero, so the fan grows symmetrically instead of walking down the screen.
 *
 * Only the box art needed work: it shipped with a baked orange background that
 * would have sat as a visible block on the card, so box-cutout.png is that file
 * with the background keyed out. The other three were already transparent and
 * keep their own colours.
 *
 * Tone alternates solid/glass. A glass card samples whatever is behind it —
 * the solid card underneath where they overlap, the photo where it overhangs —
 * so the two tones read as one stack rather than two designs.
 */
export const CARDS = [
  {
    index: '01.',
    title: ['Shipping', 'Details'],
    body: 'Input your cargo details to initialize your shipment profile.',
    art: '/assets/cargo-cards/box-cutout.png',
    tone: 'solid',
    slot: { x: 7.5, y: -13.5, rotate: 3.5 },
  },
  {
    index: '02.',
    title: ['Get an', 'Estimate'],
    body: 'Receive transparent pricing tailored to your cargo needs.',
    art: '/assets/cargo-cards/imgi_56_WZB7EDZLkENmr9LGWQgXhdflwI.png',
    tone: 'glass',
    slot: { x: 2.5, y: -4.5, rotate: 2 },
  },
  {
    index: '03.',
    title: ['Cargo', 'Handling'],
    body: 'Our crew loads and secures every item for the road ahead.',
    art: '/assets/cargo-cards/imgi_59_0M8gZZrEpTjVd0RE0hSKcnikNM.png',
    tone: 'solid',
    slot: { x: -2.5, y: 4.5, rotate: 0.5 },
  },
  {
    index: '04.',
    title: ['Logistic', 'Scheduling'],
    body: 'Finalize your transit timeline and tracking milestones.',
    art: '/assets/cargo-cards/imgi_62_B1wmuMLWlEZmleVFgGMlA0k4VU.png',
    tone: 'glass',
    slot: { x: -7.5, y: 13.5, rotate: -1 },
  },
];

/**
 * The banner and the third section are one mechanism, so they live together.
 *
 * The banner is painted above the third section (z 31 vs 30) and rises from
 * below the pin. The third section is clipped to whatever the banner has
 * already swept past, so it appears to be uncovered by the banner's trailing
 * edge rather than fading in.
 *
 * Banner first in the DOM on purpose: z-index keeps it on top regardless, and
 * on the narrow stacked fallback this gives the natural reading order
 * (story -> banner -> third).
 */
export default function ThirdReveal() {
  return (
    <>
      <section className="stage-banner" data-banner aria-label="About MOS">
        <p className="stage-banner__eyebrow">About MOS</p>
        <p className="stage-banner__text">
          We move your world with care, speed, and smart solution - trusted by those who value
          reliability, dedication, and a seamless moving experience.
        </p>
      </section>

      <section className="stage-layer stage-layer--third" data-third aria-label="Third section">
        <h2>Third section</h2>

        {/*
          Scroll-scrubbed playback is a decoded frame sequence drawn to canvas,
          not a <video>. Assigning currentTime fires an async seek that the
          browser coalesces, so a <video> can never track the wheel frame for
          frame however the media is encoded.
        */}
        <canvas className="stage-third__canvas" data-third-canvas aria-hidden="true" />

        {/* Sized in JS to the drawn frame rect, so % anchors map to image pixels. */}
        <div className="hotspots" data-hotspots aria-label="What sets MOS apart">
          {HOTSPOTS.map((hotspot, index) => (
            <Fragment key={hotspot.title.join(' ')}>
              <span className="hotspots__line" data-hotspot-line={index} aria-hidden="true" />
              <span
                className="hotspots__dot"
                data-hotspot-dot={index}
                style={{ left: `${hotspot.dot.x}%`, top: `${hotspot.dot.y}%` }}
                aria-hidden="true"
              />
              <span
                className="hotspots__label"
                data-hotspot-label={index}
                style={{ left: `${hotspot.label.x}%`, top: `${hotspot.label.y}%` }}
              >
                {hotspot.title[0]}
                <br />
                {hotspot.title[1]}
              </span>
            </Fragment>
          ))}
        </div>

        {/*
          Black everywhere but the cargo opening. The hole is punched in JS
          rather than the shade being solid, so the canvas still shows through
          the opening — the window is the real cargo bay before the image
          lands in it.
        */}
        <div className="stage-third__shade" data-third-shade aria-hidden="true" />

        {/*
          Locked at cover-fit size and only ever clipped, never scaled. The
          window grows around it, so the picture itself never moves.
          Low priority because it is not needed until eight viewports down and
          would otherwise compete with the frame sequence on first load.
        */}
        <img
          className="stage-third__reveal"
          data-third-reveal
          src="/assets/person.png"
          alt=""
          fetchPriority="low"
          decoding="async"
        />

        {/*
          Two transform channels on purpose: the slot owns where a card comes
          to rest, the card owns the entry motion. Neither tween has to know
          about the other, and the resting fan survives a scrub in either
          direction.
        */}
        <div className="cargo" data-cargo aria-label="How a move works">
          {CARDS.map((card) => (
            <div
              className="cargo__slot"
              key={card.index}
              style={
                {
                  '--slot-x': `${card.slot.x}%`,
                  '--slot-y': `${card.slot.y}%`,
                  '--slot-rotate': `${card.slot.rotate}deg`,
                } as CSSProperties
              }
            >
              <article
                className={
                  card.tone === 'glass' ? 'cargo__card cargo__card--glass' : 'cargo__card'
                }
                data-cargo-card
              >
                <p className="cargo__index">{card.index}</p>
                <h3 className="cargo__title">
                  {card.title[0]}
                  <br />
                  {card.title[1]}
                </h3>
                <img
                  className="cargo__art"
                  src={card.art}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <p className="cargo__body">{card.body}</p>
              </article>
            </div>
          ))}
        </div>

        {/*
          Narrow viewports and reduced motion have no scrub, and ordinary
          playback is already smooth, so they get a real video instead - and
          never pay for the frame sequence. Cut down from the same 1080p source
          as the frames, so both paths show identical footage.
        */}
        <video
          className="stage-third__video"
          data-third-video
          src="/assets/movers-truck-mobile.mp4"
          muted
          loop
          playsInline
          preload="none"
          disablePictureInPicture
          aria-hidden="true"
        />
      </section>
    </>
  );
}