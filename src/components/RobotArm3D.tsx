import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Grid } from "@react-three/drei";
import * as THREE from "three";

const DEG2RAD = Math.PI / 180;

// Lerp helper for smooth joint transitions
function lerpAngle(current: number, target: number, t: number) {
  return current + (target - current) * t;
}

interface ArmSegmentProps {
  length: number;
  width: number;
  color: string;
  emissive?: string;
}

const ArmSegment = ({ length, width, color, emissive }: ArmSegmentProps) => {
  return (
    <mesh position={[0, length / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[width, length, width]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive || "#000000"}
        emissiveIntensity={0.1}
        metalness={0.8}
        roughness={0.3}
      />
    </mesh>
  );
};

const JointSphere = ({ radius = 0.15, color = "#e8870e" }) => (
  <mesh castShadow>
    <sphereGeometry args={[radius, 16, 16]} />
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={0.3}
      metalness={0.6}
      roughness={0.4}
    />
  </mesh>
);

// Gripper fingers
const GripperFinger = ({ side, openAmount }: { side: 1 | -1; openAmount: number }) => {
  const offset = 0.05 + openAmount * 0.12;
  return (
    <group position={[side * offset, 0.15, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.03, 0.3, 0.06]} />
        <meshStandardMaterial color="#8a8a8a" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
};

interface RobotArmMeshProps {
  joints: number[];
}

const RobotArmMesh = ({ joints }: RobotArmMeshProps) => {
  const currentAngles = useRef([90, 90, 90, 90, 90, 180]);

  // References to each joint group for direct mutation (smooth animation)
  const waistRef = useRef<THREE.Group>(null);
  const shoulderRef = useRef<THREE.Group>(null);
  const elbowRef = useRef<THREE.Group>(null);
  const wristRollRef = useRef<THREE.Group>(null);
  const wristPitchRef = useRef<THREE.Group>(null);
  const gripLeftRef = useRef<THREE.Group>(null);
  const gripRightRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const smoothing = 0.06;
    for (let i = 0; i < 6; i++) {
      currentAngles.current[i] = lerpAngle(currentAngles.current[i], joints[i], smoothing);
    }

    const c = currentAngles.current;

    if (waistRef.current) {
      waistRef.current.rotation.y = c[5] * DEG2RAD;
    }
    if (shoulderRef.current) {
      shoulderRef.current.rotation.x = (c[4] - 90) * DEG2RAD;
    }
    if (elbowRef.current) {
      elbowRef.current.rotation.x = (c[3] - 90) * DEG2RAD;
    }
    if (wristRollRef.current) {
      wristRollRef.current.rotation.y = c[2] * DEG2RAD;
    }
    if (wristPitchRef.current) {
      wristPitchRef.current.rotation.x = (c[1] - 90) * DEG2RAD;
    }

    const gripOffset = 0.05 + (c[0] / 180) * 0.12;
    if (gripLeftRef.current) {
      gripLeftRef.current.position.x = gripOffset;
    }
    if (gripRightRef.current) {
      gripRightRef.current.position.x = -gripOffset;
    }
  });

  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.5, 0.55, 0.2, 32]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.6, 0.6, 0.04, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Waist rotation */}
      <group ref={waistRef} position={[0, 0.2, 0]}>
        <JointSphere radius={0.18} />
        
        {/* Shoulder */}
        <group ref={shoulderRef}>
          <ArmSegment length={1.0} width={0.18} color="#3a3a3a" emissive="#e8870e" />
          
          {/* Elbow joint */}
          <group position={[0, 1.0, 0]}>
            <JointSphere radius={0.14} />
            
            <group ref={elbowRef}>
              <ArmSegment length={0.8} width={0.14} color="#4a4a4a" emissive="#e8870e" />
              
              {/* Wrist roll */}
              <group ref={wristRollRef} position={[0, 0.8, 0]}>
                <JointSphere radius={0.1} />
                
                {/* Wrist pitch */}
                <group ref={wristPitchRef}>
                  <ArmSegment length={0.35} width={0.1} color="#5a5a5a" emissive="#e8870e" />
                  
                  {/* Gripper */}
                  <group position={[0, 0.35, 0]}>
                    <JointSphere radius={0.08} color="#aaaaaa" />
                    <group ref={gripLeftRef} position={[0.11, 0.15, 0]}>
                      <mesh castShadow>
                        <boxGeometry args={[0.03, 0.3, 0.06]} />
                        <meshStandardMaterial color="#8a8a8a" metalness={0.9} roughness={0.2} />
                      </mesh>
                    </group>
                    <group ref={gripRightRef} position={[-0.11, 0.15, 0]}>
                      <mesh castShadow>
                        <boxGeometry args={[0.03, 0.3, 0.06]} />
                        <meshStandardMaterial color="#8a8a8a" metalness={0.9} roughness={0.2} />
                      </mesh>
                    </group>
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};

interface RobotArm3DProps {
  joints: number[];
}

const RobotArm3D = ({ joints }: RobotArm3DProps) => {
  return (
    <div className="w-full h-full rounded-md overflow-hidden panel-inset">
      <Canvas
        shadows
        camera={{ position: [3, 2.5, 3], fov: 45 }}
        style={{ background: "transparent" }}
      >
        <color attach="background" args={["#0d1117"]} />
        <fog attach="fog" args={["#0d1117", 8, 20]} />

        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-3, 4, -3]} intensity={0.5} color="#e8870e" />
        <pointLight position={[3, 1, 3]} intensity={0.3} color="#4488ff" />

        {/* Ground grid */}
        <Grid
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#1a2030"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#253040"
          fadeDistance={12}
          fadeStrength={1}
          position={[0, 0, 0]}
        />

        {/* Ground plane for shadows */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial opacity={0.4} />
        </mesh>

        <RobotArmMesh joints={joints} />

        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={8}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2 - 0.1}
        />
      </Canvas>
    </div>
  );
};

export default RobotArm3D;
