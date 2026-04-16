import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  color?: string;
}

export function StatCard({ icon: Icon, label, value, trend, color = 'var(--edu-blue)' }: StatCardProps) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        {Icon && (
          <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}15` }}>
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
        )}
        {trend && (
          <span className="text-sm font-semibold text-[var(--edu-success)]">{trend}</span>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-3xl font-bold text-[var(--edu-text-primary)]">{value}</p>
        <p className="text-sm text-[var(--edu-text-secondary)]">{label}</p>
      </div>
    </div>
  );
}
