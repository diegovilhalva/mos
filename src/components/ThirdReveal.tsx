import { Fragment } from 'react';

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