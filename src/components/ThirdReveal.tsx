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
      </section>
    </>
  );
}