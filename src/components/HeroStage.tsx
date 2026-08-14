import type { RefObject } from 'react'

const metrics = [
    { value: "99%", label: "On-time perfomance" },
    { value: "4.9", label: "Customer ratings" },
    { value: "100+", label: "Successful operations" }
]


type HeroStageProps = {
    truckRef: RefObject<HTMLDivElement | null>;
    hitboxRef: RefObject<HTMLDivElement | null>;
    onLensEnter: (event: React.PointerEvent<HTMLDivElement>) => void;
    onLensMove: (event: React.PointerEvent<HTMLDivElement>) => void;
    onLensLeave: () => void;
};


function HeroStage({
    truckRef,
    hitboxRef,
    onLensEnter,
    onLensMove,
    onLensLeave,
}: HeroStageProps) {
    
    return (
        <div id="top" className="hero__stage" aria-label="MOS moving and logistics">
            <div className="hero__headline-mask">
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

            <a className="showreel" href="#showreel" aria-label="Watch our showreel" data-animate="showreel">
                <img data-animate="showreel-image" src="/assets/showreel.png" alt="" />
            </a>

            <div className="truck" ref={truckRef} aria-hidden="true">
                <img className="truck__shadow" src="/assets/truck-shadow.svg" alt="" />
                <img className="truck__image" src="/assets/truck.png" alt="" />

                {/* Overlaid on the tyres baked into truck.png, sized and placed from the
            measured tyre circles. Spun from the truck's own translation. */}
                <img
                    className="truck__wheel truck__wheel--front"
                    src="/assets/front-wheel.png"
                    alt=""
                    data-wheel="front"
                />
                <img
                    className="truck__wheel truck__wheel--rear-1"
                    src="/assets/rear-wheel-1.png"
                    alt=""
                    data-wheel="rear-1"
                />
                <img
                    className="truck__wheel truck__wheel--rear-2"
                    src="/assets/rear-wheel-2.png"
                    alt=""
                    data-wheel="rear-2"
                />
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
                    ref={hitboxRef}
                    onPointerEnter={onLensEnter}
                    onPointerMove={onLensMove}
                    onPointerLeave={onLensLeave}
                />
            </div>

            <div className="hero__location-mask">
                <p data-animate="location">San Antonio</p>
            </div>

            <a className="hero__cta" href="#calculate" data-animate="cta">
                <span>Calculate my move</span>
                <span className="hero__cta-arrow" aria-hidden="true">→</span>
            </a>
        </div>
    )
}

export default HeroStage