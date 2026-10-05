import { AdaptiveBadge } from './adaptive-badge';
import { Separator } from '@/components/ui/separator';
import { DiagnosticsData } from '../lib/helper';

interface IsolationViewProps {
  data: DiagnosticsData['isolation'];
}

export function IsolationStatusView({ data }: IsolationViewProps) {
  return (
    <>
      <div className="flex flex-row justify-between">
        <p>Shared Array Buffer support:</p> <AdaptiveBadge isSupported={data.isSupported} />
      </div>
      <div className="flex flex-row justify-between">
        <p>Cross-Origin Isolation:</p> <AdaptiveBadge isSupported={data.isIsolated} />
      </div>
      <Separator className="my-1" />
    </>
  );
}
