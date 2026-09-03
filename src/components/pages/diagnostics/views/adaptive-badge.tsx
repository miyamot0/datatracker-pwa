import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AdaptiveBadgeProps {
  isSupported: boolean;
}

export function AdaptiveBadge({ isSupported }: AdaptiveBadgeProps) {
  return (
    <Badge
      className={cn('bg-green-500 text-white hover:bg-green-500 cursor-default select-none whitespace-nowrap', {
        'bg-red-500 hover:bg-red-500': !isSupported,
      })}
    >
      {isSupported ? 'Enabled' : 'Disabled'}
    </Badge>
  );
}
