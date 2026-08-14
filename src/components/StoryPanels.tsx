import type { RefObject } from 'react';
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

type StoryPanelsProps = {
  phraseRef: RefObject<HTMLDivElement | null>;
  vapourRef: RefObject<VapourTextCanvasHandle | null>;
};

export default function StoryPanels({ phraseRef, vapourRef }: StoryPanelsProps) {
  return (
    <div className="stage-layer stage-layer--story">
      {/*
        Narrow viewports fall back to stacked scrolling, where the hero truck stays
        behind in the hero block. This node is display:none above 760px so the pinned
        desktop experience still renders exactly one truck.
      */}
      <div className="story__truck" aria-hidden="true">
        <img className="story__truck-shadow" src="/assets/truck-shadow.svg" alt="" />
        <img className="story__truck-image" src="/assets/truck.png" alt="" />
      </div>

      <div className="story__phrase-wrap">
        <div
          className="story__phrase"
          ref={phraseRef}
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
        <VapourTextCanvas ref={vapourRef} />
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
  );
}