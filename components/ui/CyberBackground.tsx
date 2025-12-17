'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Grid, Stars } from '@react-three/drei';
import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

function Scene() {
    // Camera is raised for a steeper "Incline" view
    const defaultCamPos = useRef(new THREE.Vector3(0, 6, 10)); 
    const { camera, pointer } = useThree();

    useFrame((state) => {
        // Parallax: Shift horizon based on mouse
        const x = pointer.x * 2.5;
        const y = pointer.y * 2.2;
        
        camera.position.lerp(
            new THREE.Vector3(defaultCamPos.current.x + (x * 0.5), defaultCamPos.current.y + (y * 0.2), defaultCamPos.current.z), 
            0.05
        );
        // Look slightly down at grid to emphasize incline
        camera.lookAt(0, 0, -100);
        
        // Tilt camera slightly with mouse x
        camera.rotation.z = x * -0.05;
    });

    return (
        <>
            <ambientLight intensity={0.5} />
            <Stars radius={60} depth={50} count={7000} factor={4} saturation={0} fade speed={1} />
            
            {/* The Landscape Grid */}
            <InfiniteLandscape />
            
            {/* Fog to hide the end of the world (Horizon) */}
            <fog attach="fog" args={['#000000', 10, 60]} />
        </>
    );
}

function InfiniteLandscape() {
    const gridRef = useRef<any>(null);
    
    // Grid settings
    // Size: Large enough to cover view
    const SECTION_SIZE = 10;
    
    useFrame((state) => {
        if (gridRef.current) {
             // Move grid towards camera (positive Z) to simulate flying forward
             // Speed: 10 units/sec
             // Modulo: MATCH SECTION_SIZE (10) for perfect loop
             gridRef.current.position.z = (state.clock.elapsedTime * 10) % SECTION_SIZE;
        }
    });

    return (
        <group ref={gridRef} position={[0, -1, 0]}>
            <Grid 
                args={[200, 200]} 
                cellColor="#003300" 
                sectionColor="#00ff41" 
                fadeDistance={60} 
                fadeStrength={2} // Strong fade to black at horizon
                cellSize={5}
                sectionSize={SECTION_SIZE} 
                infiniteGrid={true}
            />
        </group>
    );
}

export default function CyberBackground() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="fixed inset-0 bg-black -z-50" />;

  return (
    <div className="fixed inset-0 -z-50 bg-black pointer-events-none">
      <Canvas camera={{ position: [0, 1, 10], fov: 60 }} gl={{ antialias: false }}>
        <Scene />
      </Canvas>
    </div>
  );
}


