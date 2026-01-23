'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, GradientTexture, Stars, Torus } from '@react-three/drei';
import * as THREE from 'three';
import MobileFallbackBackground from './MobileFallbackBackground';

function AnimatedSphere() {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
            meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
        }
    });

    return (
        /* @ts-ignore */
        <Float speed={2} rotationIntensity={1} floatIntensity={2}>
            /* @ts-ignore */
            <Sphere ref={meshRef} args={[1.5, 64, 64]} scale={1.2}>
                /* @ts-ignore */
                <MeshDistortMaterial
                    distort={0.4}
                    speed={4}
                    roughness={0.2}
                    metalness={0.8}
                    color="#f97316"
                >
                    /* @ts-ignore */
                    <GradientTexture
                        stops={[0, 1]}
                        colors={['#f97316', '#7c2d12']}
                    />
                /* @ts-ignore */
                </MeshDistortMaterial>
            /* @ts-ignore */
            </Sphere>
        /* @ts-ignore */
        </Float>
    );
}

function Rings() {
    return (
        <group>
            {[...Array(3)].map((_, i) => (
                /* @ts-ignore */
                <Float key={i} speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
                    /* @ts-ignore */
                    <Torus args={[3 + i * 1, 0.02, 16, 100]} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}>
                        /* @ts-ignore */
                        <meshBasicMaterial color="#f97316" transparent opacity={0.1 - i * 0.02} />
                    /* @ts-ignore */
                    </Torus>
                </Float>
            ))}
        </group>
    );
}

function Particles({ count = 2000 }) {
    const points = useMemo(() => {
        const p = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            p[i * 3] = (Math.random() - 0.5) * 15;
            p[i * 3 + 1] = (Math.random() - 0.5) * 15;
            p[i * 3 + 2] = (Math.random() - 0.5) * 15;
        }
        return p;
    }, [count]);

    return (
        /* @ts-ignore */
        <points>
            {/* @ts-ignore */}
            <bufferGeometry>
                {/* @ts-ignore */}
                <bufferAttribute
                    attach="attributes-position"
                    args={[points, 3]}
                />
                {/* @ts-ignore */}
            </bufferGeometry>
            {/* @ts-ignore */}
            <pointsMaterial size={0.03} color="#f97316" transparent opacity={0.4} sizeAttenuation />
            {/* @ts-ignore */}
        </points>
    );
}

export default function LoginHero3D() {
    const [isMobile, setIsMobile] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        // Detect mobile devices or Capacitor environment
        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor;
            const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
            const isSmallScreen = window.innerWidth < 768;
            const isCapacitor = typeof (window as any).Capacitor !== 'undefined';
            return isMobileDevice || isSmallScreen || isCapacitor;
        };
        setIsMobile(checkMobile());

        const handleResize = () => setIsMobile(checkMobile());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Server-side render nothing, client will hydrate
    if (!isClient) {
        return <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#050505]" />;
    }

    // Use lightweight CSS fallback for mobile devices
    if (isMobile) {
        return <MobileFallbackBackground />;
    }

    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {/* @ts-ignore */}
            <Canvas camera={{ position: [0, 0, 8], fov: 75 }}>
                {/* @ts-ignore */}
                <ambientLight intensity={0.5} />
                {/* @ts-ignore */}
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#f97316" />
                {/* @ts-ignore */}
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#7c2d12" />
                {/* @ts-ignore */}
                <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
                {/* @ts-ignore */}
                <AnimatedSphere />
                {/* @ts-ignore */}
                <Rings />
                {/* @ts-ignore */}
                <Particles count={1500} />
                {/* @ts-ignore */}
                <fog attach="fog" args={['#050505', 5, 20]} />
            </Canvas>
        </div>
    );
}

