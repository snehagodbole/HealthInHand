import type { ReactNode } from "react";

type StatsCardProps = {
  label: string;
  value: string | number;
  detail?: string;
  icon?: ReactNode;
};

export default function StatsCard({ label, value, detail, icon }: StatsCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-stone-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-ink">{value}</p>
          {detail && <p className="mt-2 text-sm text-stone-500">{detail}</p>}
        </div>
        {icon && (
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-moss-50 text-moss-700">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
