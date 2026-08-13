import React, { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

const metrics = [
    { value: "99%", label: "On-time perfomance" },
    { value: "4.9", label: "Customer ratings" },
    { value: "100+", label: "Successful operations" }
]

const navItems = ['About us', 'Mission', 'Process', 'Projects']

function Hero() {
    const root = useRef<HTMLDivElement>(null)
    const truck = useRef<HTMLDivElement>(null)
    const containerHitbox = useRef<HTMLDivElement>(null)
    const lensInside = useRef(false)
    const lensRevealDelay = useRef<gsap.core.Tween | null>(null)
    const lensEase = useRef<ReturnType<typeof CustomEase.create> | null>(null)
    const [menuOpen, setMenuOpen] = useState(false)


    useLayoutEffect(() => {
        if (!root.current) return;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion) return;

        const context = gsap.context(() => {
            gsap.registerPlugin(CustomEase);
            const navbarEase = CustomEase.create('navbarEase', '0.364, 0, 0, 1');
            const moversEase = CustomEase.create('moversEase', '0.211, 0, 0.01, 1');
            const locationEase = CustomEase.create('locationEase', '0.207, 0, 0.01, 1');
            const statsEase = CustomEase.create('statsEase', '0.184, 0.013, 0.01, 1');
            const truckEase = CustomEase.create('truckEase', '0.232, 0, 0.01, 1');
            const cssEaseOut = CustomEase.create('cssEaseOut', '0, 0, 0.58, 1');
            lensEase.current = CustomEase.create('lensEase', '0.232, 0, 0.01, 1');
            const timeline = gsap.timeline();
            let introComplete = false;

            timeline
                .from(
                    '[data-animate="header"]',
                    { y: -24, opacity: 0, duration: 0.5001, ease: navbarEase },
                    0,
                )
                .from(
                    truck.current,
                    { xPercent: 60, duration: 1.6044, ease: truckEase },
                    0,
                )
                .from(
                    '[data-animate="headline"]',
                    { yPercent: 110, duration: 1.0161, ease: moversEase },
                    0.7566,
                )
                .from(
                    '[data-animate="location"]',
                    { yPercent: 110, duration: 0.9864, ease: locationEase },
                    0.933,
                )
                .from(
                    '[data-animate="stats"]',
                    { y: 22, opacity: 0, duration: 0.9345, ease: statsEase },
                    1.7841,
                )
                .from(
                    '[data-animate="showreel"]',
                    { scale: 0.72, opacity: 0, rotate: -35, duration: 0.864, ease: cssEaseOut },
                    1.7979,
                )
                .to({}, { duration: 3 }, 0)
                .eventCallback('onComplete', () => {
                    introComplete = true;
                });

            gsap.to('[data-animate="showreel-image"]', {
                rotate: 360,
                duration: 18,
                ease: 'none',
                repeat: -1,
            });

            const onPointerMove = (event: PointerEvent) => {
                if (lensInside.current) {
                    const bounds = containerHitbox.current?.getBoundingClientRect();
                    const outsideContainer =
                        !bounds ||
                        event.clientX < bounds.left ||
                        event.clientX > bounds.right ||
                        event.clientY < bounds.top ||
                        event.clientY > bounds.bottom;

                    if (outsideContainer) hideTruckLens();
                    return;
                }

                if (!introComplete) return;

                const x = event.clientX / window.innerWidth - 0.5;
                const y = event.clientY / window.innerHeight - 0.5;

                gsap.to(truck.current, {
                    x: x * 12,
                    y: y * 5,
                    duration: 1.2,
                    ease: 'power2.out',
                    overwrite: 'auto',
                });
                gsap.to('[data-parallax="type"]', {
                    x: x * -8,
                    y: y * -4,
                    duration: 1.35,
                    ease: 'power2.out',
                    overwrite: 'auto',
                });
            };

            window.addEventListener('pointermove', onPointerMove, { passive: true });
            return () => window.removeEventListener('pointermove', onPointerMove);
        }, root);

        return () => context.revert();
    }, [])


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
        )
    }


    const queueTruckLens = () => {
        if (lensInside.current) return

        lensInside.current = true;
        lensRevealDelay.current?.kill();
        lensRevealDelay.current = gsap.delayedCall(0.16, () => {
            if (lensInside.current) activateTruckLens()
        })
    }

    const positionTruckLens = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!truck.current) return;

        queueTruckLens();
        const bounds = truck.current.getBoundingClientRect();
        gsap.to(truck.current, {
            '--lens-x': `${event.clientX - bounds.left}px`,
            '--lens-y': `${event.clientY - bounds.top}px`,
            duration: 0.14,
            ease: 'power3.out',
            overwrite: 'auto',
        });
    }

    const showTruckLens = (event: React.PointerEvent<HTMLDivElement>) => {
        positionTruckLens(event);
    }

    const hideTruckLens = () => {
        if (!truck.current) return;

        lensInside.current = false;
        lensRevealDelay.current?.kill();
        lensRevealDelay.current = null;
        truck.current.classList.remove('truck--lens-active');
    }

    const handleMagneticMove = (event: React.PointerEvent<HTMLAnchorElement>) => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const rect = event.currentTarget.getBoundingClientRect();
        gsap.to(event.currentTarget, {
            x: (event.clientX - rect.left - rect.width / 2) * 0.16,
            y: (event.clientY - rect.top - rect.height / 2) * 0.16,
            duration: 0.35,
            ease: 'power2.out',
        })
    }

    const resetMagnetic = (event: React.PointerEvent<HTMLAnchorElement>) => {
        gsap.to(event.currentTarget, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.45)' });
    }
    return (
        <div className="hero-shell" ref={root}>
            <header className="site-header" data-animate="header">
                <a href="#top" className="brand" data-animate="MOS home">
                    <img src="/assets/logo-mark.svg" alt="MOS logo" width={"47"} height={"45"} />
                    <span>MOS</span>
                </a>

                <nav className={`nav ${menuOpen ? 'nav--open' : ''}`} aria-label="Primary navigation">
                    <div className="nav__links" data-nav-links>
                        {
                            navItems.map((item) => (
                                <a key={item} href={`#${item.toLocaleLowerCase().replace(' ', '-')}`}
                                    data-animate="nav"
                                    onClick={() => setMenuOpen(false)}>
                                    {item}
                                </a>
                            ))
                        }
                    </div>
                    <a className="nav__contact" href='#contact' data-animate="nav"
                        onPointerMove={handleMagneticMove}
                        onPointerLeave={resetMagnetic}
                        onClick={() => setMenuOpen(false)}>
                        Contact Us
                    </a>
                </nav>
                <button className="menu-toggle"
                    type="button"
                    aria-label="Toggle navigation"
                    aria-expanded={menuOpen}
                    data-menu-toggle
                    onClick={() => setMenuOpen((current) => !current)}>
                    <span />
                    <span />
                    <span />
                </button>
            </header>
            <section className="hero" aria-label="MOS moving and logistics">
                <div className="hero__stage" id='top'>
                    <div className="hero__headline-mask" data-parallax="type">
                        <h1 data-animate="headline">Movers</h1>
                    </div>
                    <div className="metrics" aria-label="Performance metrics" data-animate="stats">
                        {metrics.map((metric) => (
                            <div className="metric" key={metric.label}>
                                <strong>{metric.value}</strong>
                                <span>{metric.label}</span>
                            </div>
                        ))}
                    </div>
                    <a
                        className="showreel"
                        href="#showreel"
                        aria-label="Watch our showreel"
                        data-animate="showreel"
                    >
                        <img data-animate="showreel-image" src="/assets/showreel.png" alt="" />
                    </a>

                    <div className="truck" ref={truck} aria-hidden="true">
                        <img className="truck__shadow" src="/assets/truck-shadow.svg" alt="" />
                        <img className="truck__image" src="/assets/truck.png" alt="" />
                        <img
                            className="truck__image truck__image--pressure"
                            src="/assets/invert-color-truck.png"
                            alt=""
                        />
                        <img
                            className="truck__image truck__image--inverted"
                            src="/assets/invert-color-truck.png"
                            alt=""
                        />
                        <div
                            className="truck__container-hitbox"
                            ref={containerHitbox}
                            onPointerEnter={showTruckLens}
                            onPointerMove={positionTruckLens}
                            onPointerLeave={hideTruckLens}
                        />
                    </div>
                    <div className="hero__location-mask" data-parallax="type">
                        <p data-animate="location">San Antonio</p>
                    </div>
                    <a
                        className="hero__cta"
                        href="#calculate"
                        data-animate="cta"
                        onPointerMove={handleMagneticMove}
                        onPointerLeave={resetMagnetic}
                    >
                        <span>Calculate my move</span>
                        <span className="hero__cta-arrow" aria-hidden="true">→</span>
                    </a>
                </div>
            </section>
        </div>
    )
}

export default Hero