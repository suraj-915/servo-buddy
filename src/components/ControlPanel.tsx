import { useState, useRef, useCallback } from "react";
import JointSlider from "./JointSlider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Bluetooth,
  Save,
  Play,
  Square,
  RotateCcw,
  Repeat,
  Grip,
  RotateCw,
  ArrowUpDown,
  MoveUp,
  Move,
  CircleDot,
  Gauge,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface Pose {
  joints: number[];
  timestamp: number;
}

const JOINT_CONFIG = [
  { label: "Grip", icon: <Grip className="w-4 h-4 text-primary" />, min: 0, max: 180 },
  { label: "Wrist Pitch", icon: <ArrowUpDown className="w-4 h-4 text-primary" />, min: 0, max: 180 },
  { label: "Wrist Roll", icon: <RotateCw className="w-4 h-4 text-primary" />, min: 0, max: 180 },
  { label: "Elbow", icon: <MoveUp className="w-4 h-4 text-primary" />, min: 0, max: 180 },
  { label: "Shoulder", icon: <Move className="w-4 h-4 text-primary" />, min: 0, max: 180 },
  { label: "Waist", icon: <CircleDot className="w-4 h-4 text-primary" />, min: 0, max: 360 },
];

const ControlPanel = () => {
  const [joints, setJoints] = useState<number[]>([90, 90, 90, 90, 90, 180]);
  const [speed, setSpeed] = useState(50);
  const [poses, setPoses] = useState<Pose[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [btConnected, setBtConnected] = useState(false);
  const playRef = useRef<number | null>(null);
  const loopRef = useRef(false);

  const updateJoint = (index: number, value: number) => {
    setJoints((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const savePose = () => {
    setPoses((prev) => [...prev, { joints: [...joints], timestamp: Date.now() }]);
    toast.success("Pose saved", { description: `Pose #${poses.length + 1} stored` });
  };

  const resetPoses = () => {
    stopPlayback();
    setPoses([]);
    toast("Poses cleared");
  };

  const stopPlayback = useCallback(() => {
    if (playRef.current) {
      clearTimeout(playRef.current);
      playRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playPoses = useCallback(() => {
    if (poses.length === 0) {
      toast.error("No poses saved");
      return;
    }
    setIsPlaying(true);
    let index = 0;

    const playNext = () => {
      if (index >= poses.length) {
        if (loopRef.current) {
          index = 0;
        } else {
          setIsPlaying(false);
          return;
        }
      }
      setJoints(poses[index].joints);
      index++;
      const delay = Math.max(200, 2000 - speed * 18);
      playRef.current = window.setTimeout(playNext, delay);
    };

    playNext();
  }, [poses, speed]);

  // Keep loopRef in sync
  loopRef.current = loop;

  const connectBluetooth = async () => {
    if (btConnected) {
      setBtConnected(false);
      toast("Bluetooth disconnected");
      return;
    }
    try {
      if ("bluetooth" in navigator) {
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ["generic_access"],
        });
        if (device) {
          setBtConnected(true);
          toast.success("Connected", { description: device.name || "Device connected" });
        }
      } else {
        toast.error("Bluetooth not supported", { description: "Use Chrome on a supported device" });
      }
    } catch {
      toast.error("Connection cancelled");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center glow-amber">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold uppercase tracking-wider text-foreground">
              ARM<span className="text-primary">CTRL</span>
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              6-Axis Servo Controller
            </p>
          </div>
        </div>

        <Button
          variant={btConnected ? "default" : "outline"}
          size="sm"
          onClick={connectBluetooth}
          className={btConnected ? "glow-amber" : ""}
        >
          <Bluetooth className="w-4 h-4 mr-2" />
          <span className="text-xs uppercase tracking-wide">
            {btConnected ? "Connected" : "Connect"}
          </span>
          {btConnected && <span className="ml-2 status-dot bg-success" />}
        </Button>
      </header>

      {/* Decorative screws */}
      <div className="panel-raised industrial-border rounded-lg p-5 md:p-6 relative">
        <div className="absolute top-2 left-2 screw-hole" />
        <div className="absolute top-2 right-2 screw-hole" />
        <div className="absolute bottom-2 left-2 screw-hole" />
        <div className="absolute bottom-2 right-2 screw-hole" />

        {/* Joint Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {JOINT_CONFIG.map((joint, i) => (
            <JointSlider
              key={joint.label}
              label={joint.label}
              value={joints[i]}
              onChange={(v) => updateJoint(i, v)}
              min={joint.min}
              max={joint.max}
              icon={joint.icon}
            />
          ))}
        </div>

        {/* Speed Control */}
        <div className="panel-inset rounded-md p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Servo Speed
              </span>
            </div>
            <span className="text-sm font-bold text-primary text-glow tabular-nums">{speed}%</span>
          </div>
          <Slider
            value={[speed]}
            onValueChange={(v) => setSpeed(v[0])}
            min={1}
            max={100}
            step={1}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>Slow</span>
            <span>Fast</span>
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={savePose} variant="outline" size="sm" disabled={isPlaying}>
            <Save className="w-4 h-4 mr-2" />
            <span className="text-xs uppercase tracking-wide">Save</span>
          </Button>

          <Button
            onClick={playPoses}
            variant="default"
            size="sm"
            disabled={isPlaying || poses.length === 0}
            className="glow-amber"
          >
            <Play className="w-4 h-4 mr-2" />
            <span className="text-xs uppercase tracking-wide">Play</span>
          </Button>

          <Button onClick={stopPlayback} variant="outline" size="sm" disabled={!isPlaying}>
            <Square className="w-4 h-4 mr-2" />
            <span className="text-xs uppercase tracking-wide">Stop</span>
          </Button>

          <Button
            onClick={resetPoses}
            variant="outline"
            size="sm"
            disabled={poses.length === 0}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            <span className="text-xs uppercase tracking-wide">Reset</span>
          </Button>

          <div className="h-6 w-px bg-border mx-1" />

          {/* Loop Toggle */}
          <div className="flex items-center gap-2">
            <Repeat className={`w-4 h-4 ${loop ? "text-primary text-glow" : "text-muted-foreground"}`} />
            <Switch checked={loop} onCheckedChange={setLoop} />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Loop</span>
          </div>

          <div className="h-6 w-px bg-border mx-1" />

          {/* Pose Counter */}
          <div className="panel-inset rounded px-3 py-1.5 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Poses</span>
            <span className="text-sm font-bold text-primary text-glow tabular-nums">{poses.length}</span>
          </div>

          {/* Playing indicator */}
          {isPlaying && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="status-dot bg-primary animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest text-primary text-glow">
                Playing{loop ? " (loop)" : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
