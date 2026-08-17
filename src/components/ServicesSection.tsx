import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';


/** Headline is split into lines so each can be masked and revealed separately. */
const headline = ['Every move tells its own story', 'of care and timing'];

/**
 * The four services the client advertises, with the add-ons they name against
 * each — furniture blankets, bed setup, boxes and expert packing, washer and
 * dryer connection. Nothing here claims a capability their current site does
 * not already list. Three tags per row keeps every row the same height.
 */


const services = [
    {
        name: 'Residential Moving',
        tags: ['Houses & Apartments', 'Furniture Blankets', 'Bed Setup'],
        image: '/assets/movings/residential-moving.webp',
        href: '#calculate',
    },
    {
        name: 'Corporate Moving',
        tags: ['Offices & Suites', '7-Day Scheduling', 'Minimal Downtime'],
        image: '/assets/movings/corporate-moving.jpeg',
        href: '#calculate',
    },
    {
        name: 'Long Distance Moving',
        tags: ['Across Texas', 'Licensed & Insured', 'Short or Long Haul'],
        image: '/assets/movings/long-distance-moving.jpeg',
        href: '#calculate',
    },
    {
        name: 'Packing & Supplies',
        tags: ['Moving Boxes', 'Expert Packing', 'Appliance Hookup'],
        image: '/assets/movings/packing-supplies.jpeg',
        href: '#calculate',
    },
];


/**
 * The services list that follows the pinned experience.
 *
 * Self-contained: it owns its own ScrollTrigger and never touches the pinned
 * timeline in Experience.tsx. Lenis drives real window scroll and already calls
 * ScrollTrigger.update, so a trigger declared here just works alongside it.
 *
 * Hidden states are applied with gsap.set() inside the effect rather than with
 * .from() tweens. Same result on screen, but the markup renders visible when
 * JavaScript never runs — a .from() would strand the whole section at opacity 0.
 */

export default function ServicesSection() {
    const root = useRef<HTMLElement>(null)

    useLayoutEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        gsap.registerPlugin(CustomEase, ScrollTrigger);

        const context = gsap.context(() => {
            const ease = CustomEase.create('servicesEase', '0.21, 0, 0.19, 1');

            const eyebrow = '[data-services-eyebrow]';
            const lines = gsap.utils.toArray<HTMLElement>('[data-services-line]');
            const cta = '[data-services-cta]';
            const rows = gsap.utils.toArray<HTMLElement>('[data-service-row]');
            const rules = gsap.utils.toArray<HTMLElement>('[data-service-rule]');

            gsap.set([eyebrow, cta], { yPercent: 60, opacity: 0 });
            gsap.set(lines, { yPercent: 110 });
            gsap.set(rows, { y: 30, opacity: 0 });
            gsap.set(rules, { scaleX: 0, transformOrigin: '0 50%' });

            gsap
                .timeline({
                    scrollTrigger: { trigger: root.current, start: 'top 72%', once: true },
                })
                .to(eyebrow, { yPercent: 0, opacity: 1, duration: 0.6, ease })
                .to(lines, { yPercent: 0, duration: 0.85, stagger: 0.08, ease }, 0.05)
                .to(cta, { yPercent: 0, opacity: 1, duration: 0.55, ease }, 0.34)
                // Rules and rows share a stagger so each rule draws under its own row,
                // rather than the whole grid ruling itself before any row arrives.
                .to(rules, { scaleX: 1, duration: 0.7, stagger: 0.08, ease }, 0.4)
                .to(rows, { y: 0, opacity: 1, duration: 0.65, stagger: 0.08, ease }, 0.46);
        }, root);

        return () => context.revert();
    }, []);

    return (
        <section className="services" id="services" ref={root} aria-labelledby="services-title">
            <div className="services__intro">
                <p className="services__eyebrow-mask">
                    <span data-services-eyebrow>
                        <svg className="services__mark" viewBox="0 0 12 12" aria-hidden="true">
                            <path d="M2 10 L8 1 L10 3 L4 11 Z" fill="currentColor" />
                        </svg>
                        Our services
                    </span>
                </p>

                <div className="services__heading">
                    <h2 className="services__title" id="services-title">
                        {headline.map((line) => (
                            // Each line gets its own overflow-hidden mask so it can slide up
                            // from behind the one above it.
                            <span className="services__line-mask" key={line}>
                                <span data-services-line>{line}</span>
                            </span>
                        ))}
                    </h2>

                    <p className="services__cta-mask">
                        <a className="services__cta" href="#calculate" data-services-cta>
                            Get a free estimate
                            <span aria-hidden="true">→</span>
                        </a>
                    </p>

                </div>
            </div>
            <ul className="services__list">
                {services.map((service) => (
                    <li className="service-row" key={service.name} >
                        <span className="service-row__rule" data-service-rule aria-hidden="true" />
                        <a className="service-row__link" href={service.href} data-service-row>
                            <span className="service-row__name">{service.name}</span>
                            {/* Sits in the empty gap between the name and the tags, and is
                  allowed to overhang the row's rules on both sides. */}
                            <span className="service-row__media" aria-hidden="true">
                                <img src={service.image} alt="" loading="lazy" decoding="async" />
                            </span>
                            <span className="service-row__tags">
                                {service.tags.map((tag) => (
                                    <span className="service-row__tag" key={tag}>
                                        {tag}
                                    </span>
                                ))}
                            </span>
                            <span className="service-row__arrow" aria-hidden="true">
                                →
                            </span>
                        </a>
                    </li>
                ))}
            </ul>

            {/* Closes the last row. Outside the list so the <ul> holds only <li>. */}
            <span className="services__rule-end" data-service-rule aria-hidden="true" />
        </section>
    )
}