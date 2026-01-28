'use client';

import { useRef, useState, useEffect } from 'react';
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

        <Float speed={2} rotationIntensity={1} floatIntensity={2}>

            <Sphere ref={meshRef} args={[1.5, 64, 64]} scale={1.2}>

                <MeshDistortMaterial
                    distort={0.4}
                    speed={4}
                    roughness={0.2}
                    metalness={0.8}
                    color="#f97316"
                >

                    <GradientTexture
                        stops={[0, 1]}
                        colors={['#f97316', '#7c2d12']}
                    />

                </MeshDistortMaterial>

            </Sphere>

        </Float>
    );
}

function Rings() {
    const [ringRotations] = useState(() => {
        return [...Array(3)].map(() => [
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            0
        ] as [number, number, number]);
    });

    return (
        <group>
            {ringRotations.map((rotation, i) => (

                <Float key={i} speed={1} rotationIntensity={0.5} floatIntensity={0.5}>

                    <Torus args={[3 + i * 1, 0.02, 16, 100]} rotation={rotation}>

                        <meshBasicMaterial color="#f97316" transparent opacity={0.1 - i * 0.02} />

                    </Torus>
                </Float>
            ))}
        </group>
    );
}

function Particles({ count = 2000 }) {
    const [points] = useState(() => {
        const p = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            p[i * 3] = (Math.random() - 0.5) * 15;
            p[i * 3 + 1] = (Math.random() - 0.5) * 15;
            p[i * 3 + 2] = (Math.random() - 0.5) * 15;
        }
        return p;
    });

    return (

        <points>

            <bufferGeometry>

                <bufferAttribute
                    attach="attributes-position"
                    args={[points, 3]}
                />

            </bufferGeometry>

            <pointsMaterial size={0.03} color="#f97316" transparent opacity={0.4} sizeAttenuation />

        </points>
    );
}

export default function LoginHero3D() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Server-side render nothing, client will hydrate
    if (!isClient) {
        return <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#050505]" />;
    }

    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <Canvas camera={{ position: [0, 0, 8], fov: 75 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#f97316" />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#7c2d12" />
                <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
                <AnimatedSphere />
                <Rings />
                <Particles count={1500} />
                <fog attach="fog" args={['#050505', 5, 20]} />
            </Canvas>
        </div>
    );
}

