import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "./theme-provider";

const DEG2RAD = Math.PI / 180;

function lerpAngle(current: number, target: number, t: number) {
  return current + (target - current) * t;
}

// --- COLOR DICTIONARY ---
interface ThemePalette {
  base: string;
  segment: string;
  joint: string;
  jointEmissive: string;
  gripper: string;
  gripperPad: string;
  background: string;
  grid: string;
  gridSection: string;
  lightIntensity: number;
}

const THEME_COLORS: Record<string, ThemePalette> = {
  blueprint: {
    base: "#64748b",          // Slate grey structural base
    segment: "#ffffff",       // Stark drafting white for the main body
    joint: "#06b6d4",         // (Unchanged accent)
    jointEmissive: "#0891b2", // (Unchanged accent)
    gripper: "#94a3b8",       // Slate gripper
    gripperPad: "#06b6d4",    // (Unchanged accent)
    background: "#081120",
    grid: "#1e3a5f",
    gridSection: "#2a5288",
    lightIntensity: 0.8,
  },
  industrial: {
    base: "#333333",          // Heavy dark iron base
    segment: "#f3f4f6",       // Classic Industrial White machinery body
    joint: "#e8870e",         // (Unchanged accent)
    jointEmissive: "#e8870e", // (Unchanged accent)
    gripper: "#d1d5db",       // Steel grey metallic gripper
    gripperPad: "#e8870e",    // (Unchanged accent)
    background: "#0d1117",
    grid: "#1a2030",
    gridSection: "#253040",
    lightIntensity: 1.2,
  },
 cyberpunk: {
    base: "#d1d5db",          // Metallic silver base
    segment: "#ffffff",       // High-tech ceramic white
    joint: "#ff0040",         // (Unchanged accent)
    jointEmissive: "#ff0040", // (Unchanged accent)
    gripper: "#9ca3af",       // Darker steel gripper
    gripperPad: "#ff0040",    // (Unchanged accent)
    background: "#090114",
    grid: "#2a004d",
    gridSection: "#4d008c",
    lightIntensity: 1.5,
  },
  laboratory: {
    base: "#cbd5e1",
    segment: "#ffffff",
    joint: "#3b82f6",
    jointEmissive: "#2563eb",
    gripper: "#f1f5f9",
    gripperPad: "#ef4444",
    background: "#f8fafc",
    grid: "#e2e8f0",
    gridSection: "#cbd5e1",
    lightIntensity: 0.6,
  }
};

// --- COMPONENTS ---
interface ArmSegmentProps {
  length: number;
  width: number;
  colors: ThemePalette;
}

const ArmSegment = ({ length, width, colors }: ArmSegmentProps) => {
  const coreWidth = width * 0.5;
  const plateWidth = width * 1.1;
  const plateThickness = width * 0.8;

  return (
    <group position={[0, length / 2, 0]}>
      {/* Inner Mechanical Core */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[coreWidth, coreWidth, length * 0.95, 16]} />
        <meshStandardMaterial color="#222222" roughness={0.5} metalness={0.8} />
      </mesh>

      {/* Front Curved Armor Plate */}
      <RoundedBox 
        args={[plateWidth, length * 0.85, plateThickness * 0.4]} 
        position={[0, 0, plateThickness / 2]} 
        radius={0.03} 
        smoothness={4} 
        castShadow 
        receiveShadow
      >
        <meshStandardMaterial color={colors.segment} roughness={0.3} metalness={0.7} />
      </RoundedBox>

      {/* Back Curved Armor Plate */}
      <RoundedBox 
        args={[plateWidth, length * 0.85, plateThickness * 0.4]} 
        position={[0, 0, -plateThickness / 2]} 
        radius={0.03} 
        smoothness={4} 
        castShadow 
        receiveShadow
      >
        <meshStandardMaterial color={colors.segment} roughness={0.3} metalness={0.7} />
      </RoundedBox>

      {/* Side Support Rails */}
      <mesh position={[plateWidth / 2 + 0.02, 0, 0]} castShadow>
        <boxGeometry args={[0.04, length * 0.75, plateThickness * 0.9]} />
        <meshStandardMaterial color={colors.base} roughness={0.4} metalness={0.8} />
      </mesh>
      <mesh position={[-plateWidth / 2 - 0.02, 0, 0]} castShadow>
        <boxGeometry args={[0.04, length * 0.75, plateThickness * 0.9]} />
        <meshStandardMaterial color={colors.base} roughness={0.4} metalness={0.8} />
      </mesh>

      {/* Front Hydraulic Pistons & Glowing Wiring */}
      <group position={[0, 0, plateThickness / 2 + 0.03]}>
        {/* Left Chrome Piston */}
        <mesh position={[-0.06, 0, 0]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, length * 0.8, 12]} />
          <meshStandardMaterial color="#cccccc" roughness={0.1} metalness={1.0} />
        </mesh>
        {/* Right Chrome Piston */}
        <mesh position={[0.06, 0, 0]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, length * 0.8, 12]} />
          <meshStandardMaterial color="#cccccc" roughness={0.1} metalness={1.0} />
        </mesh>
        {/* Central Glowing Power Wire */}
        <mesh position={[0, 0, 0.02]} castShadow>
          <cylinderGeometry args={[0.008, 0.008, length * 0.9, 8]} />
          <meshStandardMaterial color={colors.jointEmissive} emissive={colors.jointEmissive} emissiveIntensity={1.5} />
        </mesh>
      </group>

      {/* Mechanical Joint Housings (Caps) at the Ends */}
      <mesh position={[0, length / 2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[width * 0.55, width * 0.55, width * 1.3, 24]} />
        <meshStandardMaterial color={colors.base} roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[0, -length / 2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[width * 0.55, width * 0.55, width * 1.3, 24]} />
        <meshStandardMaterial color={colors.base} roughness={0.5} metalness={0.6} />
      </mesh>
    </group>
  );
};

const JointSphere = ({ radius = 0.15, colors }: { radius?: number, colors: ThemePalette }) => (
  <mesh castShadow>
    <sphereGeometry args={[radius, 32, 32]} />
    <meshStandardMaterial
      color={colors.joint}
      emissive={colors.jointEmissive}
      emissiveIntensity={0.5}
      metalness={0.5}
      roughness={0.4}
    />
  </mesh>
);

interface RobotArmMeshProps {
  joints: number[];
  colors: ThemePalette;
}

const RobotArmMesh = ({ joints, colors }: RobotArmMeshProps) => {
  const currentAngles = useRef([90, 90, 90, 90, 90, 180]);

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

    if (waistRef.current) waistRef.current.rotation.y = c[5] * DEG2RAD;
    if (shoulderRef.current) shoulderRef.current.rotation.x = (c[4] - 90) * DEG2RAD;
    if (elbowRef.current) elbowRef.current.rotation.x = (c[3] - 90) * DEG2RAD;
    if (wristRollRef.current) wristRollRef.current.rotation.y = c[2] * DEG2RAD;
    if (wristPitchRef.current) wristPitchRef.current.rotation.x = (c[1] - 90) * DEG2RAD;

    const maxGripAngle = 40 * DEG2RAD;
    const gripAngle = (c[0] / 180) * maxGripAngle;
    if (gripLeftRef.current) gripLeftRef.current.rotation.z = -gripAngle;
    if (gripRightRef.current) gripRightRef.current.rotation.z = gripAngle;
  });

  return (
    <group>
      {/* Multi-tier Heavy Base Support */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.8, 0.85, 0.04, 32]} />
        <meshStandardMaterial color={colors.base} metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.14, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.5, 0.65, 0.2, 32]} />
        <meshStandardMaterial color={colors.segment} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.26, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.4, 0.5, 0.04, 32]} />
        <meshStandardMaterial color={colors.gripper} metalness={0.8} roughness={0.3} />
      </mesh>

      <group ref={waistRef} position={[0, 0.35, 0]}>
        <JointSphere radius={0.24} colors={colors} />
        
        <group ref={shoulderRef}>
          {/* Main Thick Shoulder Segment */}
          <ArmSegment length={1.1} width={0.32} colors={colors} />
          
          <group position={[0, 1.1, 0]}>
            <JointSphere radius={0.20} colors={colors} />
            
            <group ref={elbowRef}>
              {/* Secondary Elbow Segment */}
              <ArmSegment length={0.9} width={0.26} colors={colors} />
              
              <group ref={wristRollRef} position={[0, 0.9, 0]}>
                <JointSphere radius={0.16} colors={colors} />
                
                <group ref={wristPitchRef}>
                  {/* Wrist Segment */}
                  <ArmSegment length={0.4} width={0.18} colors={colors} />
                  
                  {/* Highly Detailed Heavy Gripper Mount */}
                  <group position={[0, 0.4, 0]}>
                  <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.16, 0.16, 0.1, 16]} />
                      {<meshStandardMaterial color={colors.gripper} metalness={0.8} roughness={0.3} />}
                    </mesh>
                    <RoundedBox args={[0.3, 0.1, 0.16]} position={[0, 0.1, 0]} radius={0.02} smoothness={4} castShadow>
                      <meshStandardMaterial color={colors.base} metalness={0.7} roughness={0.4} />
                    </RoundedBox>

                    {/* Left Jaw */}
                    <group ref={gripLeftRef} position={[0.09, 0.15, 0]}>
                      <RoundedBox args={[0.045, 0.24, 0.09]} position={[0, 0.1, 0]} radius={0.01} castShadow>
                        <meshStandardMaterial color={colors.segment} metalness={0.8} roughness={0.3} />
                      </RoundedBox>
                      <mesh castShadow position={[-0.035, 0.24, 0]}>
                        <boxGeometry args={[0.09, 0.07, 0.08]} />
                        <meshStandardMaterial color={colors.gripper} metalness={0.9} roughness={0.2} />
                      </mesh>
                      <mesh position={[-0.08, 0.24, 0]}>
                        <boxGeometry args={[0.015, 0.06, 0.07]} />
                        <meshStandardMaterial color={colors.gripperPad} emissive={colors.gripperPad} emissiveIntensity={0.8} />
                      </mesh>
                    </group>

                    {/* Right Jaw */}
                    <group ref={gripRightRef} position={[-0.09, 0.15, 0]}>
                      <RoundedBox args={[0.045, 0.24, 0.09]} position={[0, 0.1, 0]} radius={0.01} castShadow>
                        <meshStandardMaterial color={colors.segment} metalness={0.8} roughness={0.3} />
                      </RoundedBox>
                      <mesh castShadow position={[0.035, 0.24, 0]}>
                        <boxGeometry args={[0.09, 0.07, 0.08]} />
                        <meshStandardMaterial color={colors.gripper} metalness={0.9} roughness={0.2} />
                      </mesh>
                      <mesh position={[0.08, 0.24, 0]}>
                        <boxGeometry args={[0.015, 0.06, 0.07]} />
                        <meshStandardMaterial color={colors.gripperPad} emissive={colors.gripperPad} emissiveIntensity={0.8} />
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
  const { theme } = useTheme();
  const colors = THEME_COLORS[theme] || THEME_COLORS.blueprint;

  return (
    <div className="w-full h-full rounded-md overflow-hidden panel-inset transition-colors duration-500">
      <Canvas shadows camera={{ position: [3.5, 3.5, 3.5], fov: 48 }} style={{ background: "transparent" }}>
        <color attach="background" args={[colors.background]} />
        <fog attach="fog" args={[colors.background, 8, 22]} />

        <ambientLight intensity={colors.lightIntensity * 0.4} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={colors.lightIntensity * 1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />
        <pointLight position={[-3, 4, -3]} intensity={colors.lightIntensity * 0.6} color={colors.jointEmissive} />
        <pointLight position={[3, 2, 3]} intensity={colors.lightIntensity * 0.4} color="#ffffff" />

        <Grid
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor={colors.grid}
          sectionSize={2}
          sectionThickness={1}
          sectionColor={colors.gridSection}
          fadeDistance={12}
          fadeStrength={1}
          position={[0, 0, 0]}
        />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial opacity={theme === "laboratory" ? 0.05 : 0.5} />
        </mesh>

        <RobotArmMesh joints={joints} colors={colors} />

        <OrbitControls enablePan={false} minDistance={2} maxDistance={9} minPolarAngle={0.1} maxPolarAngle={Math.PI / 2 - 0.05} />
      </Canvas>
    </div>
  );
};

export default RobotArm3D;