import React, { useEffect, useRef, useState } from "react";
import styles from "./ParallaxHero.module.css";

type ParallaxHeroProps = {
    /** Ruta desde /public (ej: /images/background/fondo.jpg) */
    image: string;
    /** Alto del hero (por defecto: 100vh - navbar) */
    height?: string;
    /** Velocidad del parallax (0 = fijo, 1 = igual al scroll). Sugerido: 0.2 - 0.6 */
    speed?: number;
    /** Mostrar flecha de scroll y a qué id baja */
    arrowToId?: string;
    /** Contenido centrado dentro del hero (títulos, párrafos, botones) */
    children?: React.ReactNode;
};

const ParallaxHero: React.FC<ParallaxHeroProps> = ({ image, height, speed = 0.4, arrowToId, children }) => {
    const ref = useRef<HTMLElement | null>(null);
    const rafId = useRef<number | null>(null);
    const ticking = useRef(false);
    const [navH, setNavH] = useState<number | null>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));
        const k = clamp(speed, 0, 1);

        const update = () => {
            ticking.current = false;
            const node = ref.current;
            if (!node) return;
            const rect = node.getBoundingClientRect();
            const vh = window.innerHeight || document.documentElement.clientHeight || 0;
            if (rect.bottom < 0 || rect.top > vh) return;
            const maxOffset = Math.max(0, rect.height * k);
            node.style.setProperty('--p-extra', `${maxOffset.toFixed(1)}px`);
            const offset = -rect.top * k;
            node.style.setProperty('--py', `${offset.toFixed(1)}px`);
        };

        const onScroll = () => {
            if (!ticking.current) {
                ticking.current = true;
                rafId.current = window.requestAnimationFrame(update);
            }
        };

        const onResize = () => {
            onScroll();
        };

        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize, { passive: true });
        window.addEventListener('orientationchange', onResize, { passive: true } as any);
        return () => {
            window.removeEventListener('scroll', onScroll as any);
            window.removeEventListener('resize', onResize as any);
            window.removeEventListener('orientationchange', onResize as any);
            if (rafId.current) cancelAnimationFrame(rafId.current);
        };
    }, [speed]);

    // Measure header/nav height and keep it updated (ResizeObserver + resize)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const header = document.querySelector('header');
        const updateNav = () => {
            const h = header ? (header as HTMLElement).getBoundingClientRect().height : 0;
            setNavH(Math.round(h));
        };

        updateNav();

        let ro: ResizeObserver | null = null;
        try {
            if ((window as any).ResizeObserver && header) {
                ro = new (window as any).ResizeObserver(updateNav);
                if (ro && header) ro.observe(header as Element);
            }
        } catch (err) {
            ro = null;
        }

        window.addEventListener('resize', updateNav, { passive: true });

        // If Bootstrap collapse toggles, update after the animation so height is correct
        const collapseEls = Array.from(document.querySelectorAll('.navbar-collapse')) as HTMLElement[];
        const onCollapse = () => setTimeout(updateNav, 160);
        collapseEls.forEach((el) => {
            el.addEventListener('shown.bs.collapse', onCollapse as EventListener);
            el.addEventListener('hidden.bs.collapse', onCollapse as EventListener);
        });

        return () => {
            window.removeEventListener('resize', updateNav as any);
            if (ro && header) ro.unobserve(header as Element);
            collapseEls.forEach((el) => {
                el.removeEventListener('shown.bs.collapse', onCollapse as EventListener);
                el.removeEventListener('hidden.bs.collapse', onCollapse as EventListener);
            });
        };
    }, []);

    return (
        <section
            ref={ref as any}
            className={styles["parallax-hero"]}
            style={{
                // By default the hero should fill the remaining viewport under the
                // navbar so navbar + hero together do not exceed 100vh.
                // Use measured navH when available so the hero always fits.
                height: height || `calc(100vh - ${navH ?? 0}px)`,
                width: '100vw'
            }}
            role="img"
            aria-label="Sección destacada"
        >
            <div className={styles["parallax-bg"]} style={{ backgroundImage: `url("${image}")` }} />
            <div className={`${styles["hero-content"]} container text-center text-white`}>
                {children}
            </div>

            {arrowToId && (
                <a href={`#${arrowToId}`} className={styles["scroll-down-arrow"]} aria-label="Bajar">
                    <i className="bi bi-chevron-down" />
                </a>
            )}
        </section>
    );
};

export default ParallaxHero;
