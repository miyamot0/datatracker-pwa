import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export const WrappedButton = ({ active, children }: { active: boolean; children: ReactNode }) => {
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
};
