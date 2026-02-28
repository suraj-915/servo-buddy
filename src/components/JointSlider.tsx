import { Slider } from "@/components/ui/slider";

interface JointSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  icon?: React.ReactNode;
}

const JointSlider = ({ label, value, onChange, min = 0, max = 180, icon }: JointSliderProps) => {
  return (
    <div className="panel-inset rounded-md p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </span>
        </div>
        <span className="text-sm font-bold text-primary text-glow tabular-nums">
          {value}°
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        min={min}
        max={max}
        step={1}
        className="cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{min}°</span>
        <span>{max}°</span>
      </div>
    </div>
  );
};

export default JointSlider;
