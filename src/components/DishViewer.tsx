import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, useTexture } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";

function Plate({ image }: { image: string }) {
  const ref = useRef<THREE.Group>(null);
  const tex = useTexture(image);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  useFrame((_, d) => {
    if (ref.current) ref.current.rotation.y += Math.min(d, 0.05) * 0.35;
  });
  return (
    <group ref={ref} rotation={[0.15, 0, 0]}>
      <mesh castShadow position={[0, 0.06, 0]}>
        <cylinderGeometry args={[1.62, 1.5, 0.12, 96]} />
        <meshStandardMaterial attach="material-0" color="#1c1612" roughness={0.45} metalness={0.2} />
        <meshStandardMaterial attach="material-1" map={tex} roughness={0.55} />
        <meshStandardMaterial attach="material-2" color="#120e0b" />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.64, 0.035, 16, 120]} />
        <meshStandardMaterial color="#d4a24c" metalness={0.9} roughness={0.25} />
      </mesh>
    </group>
  );
}

export default function DishViewer({ image }: { image: string }) {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 2.6, 3.2], fov: 40 }} shadows>
      <ambientLight intensity={0.35} />
      <spotLight position={[3, 6, 3]} angle={0.5} penumbra={0.8} intensity={60} color="#ffcf8a" castShadow />
      <pointLight position={[-3, 2, -2]} intensity={8} color="#ff9a3c" />
      <Suspense fallback={null}>
        <Plate image={image} />
        <Environment>
          <Lightformer intensity={2} color="#ffd59a" position={[0, 5, 0]} scale={[10, 10, 1]} />
          <Lightformer intensity={0.8} color="#ff8a3c" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
        </Environment>
      </Suspense>
      <ContactShadows position={[0, -0.1, 0]} opacity={0.6} scale={6} blur={2.6} far={2} />
      <OrbitControls enablePan={false} minDistance={2.6} maxDistance={6} minPolarAngle={0.2} maxPolarAngle={1.4} />
    </Canvas>
  );
}
