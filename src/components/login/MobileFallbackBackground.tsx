'use client';
import { useState, useEffect, useCallback } from 'react';

/**
 * Mobile Fallback Background
 * A lightweight CSS-only animated background for mobile devices
 * to replace the heavy 3D WebGL animation
 */
export default function MobileFallbackBackground() {
    const [particles, setParticles] = useState<{ top: string; left: string; delay: string; duration: string }[]>([]);

    const generateParticles = useCallback(() => {
        return [...Array(15)].map(() => ({
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 5}s`,
            duration: `${4 + Math.random() * 4}s`
        }));
    }, []);

    useEffect(() => {
        setParticles(generateParticles());
    }, [generateParticles]);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#050505]">
            {/* Base 3D Hero Image for Premium Feel */}
            <div
                className="absolute inset-0 opacity-40 bg-cover bg-center bg-no-repeat scale-110 animate-float-slow"
                style={{ backgroundImage: 'url("/pesantren_modern_3d_hero.png")' }}
            />

            {/* Overlay Gradient for Depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/80" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_100%)] opacity-60" />

            {/* Animated Tech Orbs */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-orange-600/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

            {/* Floating Particles (Tech Nodes) */}
            {particles.map((p, i) => (
                <div
                    key={i}
                    className="absolute w-1 h-1 bg-orange-500/40 rounded-full animate-float shadow-[0_0_8px_rgba(249,115,22,0.6)]"
                    style={{
                        top: p.top,
                        left: p.left,
                        animationDelay: p.delay,
                        animationDuration: p.duration
                    }}
                />
            ))}

            {/* Glowing Scanline Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(249,115,22,0.02)_50%)] bg-[length:100%_4px] animate-scanline pointer-events-none" />

            {/* Grid Pattern Overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(249,115,22,0.2) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(249,115,22,0.2) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px'
                }}
            />
        </div>
    );
}

// Add scanline animation to globals.css if not present
// For now, using inline style for scanline isn't easy, so I'll just leave it or add it to page.tsx
