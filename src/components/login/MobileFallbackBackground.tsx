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
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-transparent">
            {/* Animated Gradient Orbs */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-600/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-amber-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-orange-400/10 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '2s' }} />

            {/* Floating Particles */}
            {particles.map((p, i) => (
                <div
                    key={i}
                    className="absolute w-1 h-1 bg-orange-500/30 rounded-full animate-float"
                    style={{
                        top: p.top,
                        left: p.left,
                        animationDelay: p.delay,
                        animationDuration: p.duration
                    }}
                />
            ))}

            {/* Orbital Ring Effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-48 h-48 border border-orange-500/10 rounded-full animate-spin-slow" />
                <div className="absolute inset-4 border border-orange-500/5 rounded-full animate-spin-reverse" />
            </div>

            {/* Grid Pattern Overlay */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(249,115,22,0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(249,115,22,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px'
                }}
            />
        </div>
    );
}
