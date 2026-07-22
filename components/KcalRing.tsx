interface Props {
  consumed: number;
  target: number;
  size?: number;
}

export default function KcalRing({ consumed, target, size = 96 }: Props) {
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const r = (size - 12) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);
  const color = pct >= 1 ? '#EF4444' : pct >= 0.8 ? '#22C55E' : '#7C3AED';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={8} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-gray-800 leading-none">{Math.round(consumed)}</span>
        <span className="text-[10px] text-gray-400">kcal</span>
      </div>
    </div>
  );
}
