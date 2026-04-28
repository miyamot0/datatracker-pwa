import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type Props = {
  active: boolean;
  children: ReactNode;
};

/**
 * Badge component that indicates the sync status of the remote directory.
 *
 * @param {boolean} active - Indicates whether the remote access is authorized (true) or not (false).
 * @param {ReactNode} children - Optional child elements to be rendered alongside the badge.
 * @return {ReactNode} A badge with text and optional children elements.
 */
export function SyncStatusBadge({ active, children }: Props) {
  return (
    <div className="flex flex-row items-center gap-2 h-fit">
      <Badge
        className={cn('text-nowrap text-white', {
          'bg-green-500 hover:bg-green-400': active,
          'bg-red-500 hover:bg-red-400': !active,
        })}
      >
        {active ? 'Remote Access Authorized' : 'No Remote Selected'}
      </Badge>
      {children}
    </div>
  );
}
