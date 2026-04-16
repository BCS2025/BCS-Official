import { useEffect, useRef } from 'react';

/**
 * Scroll-reveal wrapper — fades children in when they enter the viewport.
 * Usage: <Reveal delay={100} className="flex flex-col">...</Reveal>
 */
export default function Reveal({ children, className = '', delay = 0, as: Tag = 'div' }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.style.transitionDelay = `${delay}ms`;
                    el.classList.add('reveal-visible');
                    observer.unobserve(el);
                }
            },
            { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [delay]);

    return (
        <Tag ref={ref} className={`reveal-base ${className}`}>
            {children}
        </Tag>
    );
}
