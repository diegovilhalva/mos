import { useState } from 'react';
import gsap from 'gsap';

const navItems = ['About us', 'Mission', 'Process', 'Projects']
function SiteHeader() {
    const [menuOpen, setMenuOpen] = useState(false)
    const handleMagneticMove = (event: React.PointerEvent<HTMLAnchorElement>) => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const rect = event.currentTarget.getBoundingClientRect();
        gsap.to(event.currentTarget, {
            x: (event.clientX - rect.left - rect.width / 2) * 0.16,
            y: (event.clientY - rect.top - rect.height / 2) * 0.16,
            duration: 0.35,
            ease: 'power2.out',
        });
    };

    const resetMagnetic = (event: React.PointerEvent<HTMLAnchorElement>) => {
        gsap.to(event.currentTarget, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.45)' });
    }
    return (
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
    )
}

export default SiteHeader