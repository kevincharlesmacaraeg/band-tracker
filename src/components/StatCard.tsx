interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export default function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#555] mb-2">{label}</p>
      <p className={`font-display text-4xl ${accent ? 'text-[#4d65ff]' : 'text-white'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-[#444] mt-1">{sub}</p>}
    </div>
  );
}
