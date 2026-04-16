import React from 'react';
import { Badge } from './ui/badge';

type Status =
  | 'Draft'
  | 'Submitted'
  | 'Under review'
  | 'Accepted'
  | 'Rejected'
  | 'More info needed'
  | 'Published'
  | 'Closed'
  | 'Active'
  | 'Inactive'
  | 'Banned';

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusStyle = (status: Status) => {
    switch (status) {
      case 'Accepted':
      case 'Published':
      case 'Active':
        return 'bg-[#30D158] text-white border-[#30D158]';
      case 'Under review':
      case 'Submitted':
        return 'bg-[#64D2FF] text-white border-[#64D2FF]';
      case 'Rejected':
      case 'Closed':
      case 'Banned':
        return 'bg-[#FF3B30] text-white border-[#FF3B30]';
      case 'More info needed':
      case 'Draft':
        return 'bg-[#FF9F0A] text-white border-[#FF9F0A]';
      case 'Inactive':
        return 'bg-[#86868B] text-white border-[#86868B]';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <Badge
      className={`${getStatusStyle(status)} rounded-full px-3 py-1 text-xs font-semibold`}
      variant="outline"
    >
      {status}
    </Badge>
  );
}
