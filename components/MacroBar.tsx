interface Props {
  label: string;
  value: number;
  goal?: number;
  unit?: string;
  color: string;
}

export default function MacroBar({ label, value, goal, unit = 'g', color }: Props) {
  const pct = goal && goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  const exceeded = goal ? value > goal : false;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span className="font-medium text-gray-700">{label}</span>
        <span>
          <span className={`font-semibold ${exceeded ? 'text-red-500' : 'text-gray-800'}`}>
            {Math.round(value)}{unit}
          </span>
          {goal != null && <span className="text-gray-400"> / {Math.round(goal)}{unit}</span>}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
