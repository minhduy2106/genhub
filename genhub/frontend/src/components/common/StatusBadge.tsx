'use client';
import { ORDER_STATUS } from '@/lib/utils/constants';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = ORDER_STATUS[status as keyof typeof ORDER_STATUS] ?? {
    label: status,
    color: 'bg-gray-100 text-gray-700',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
}
