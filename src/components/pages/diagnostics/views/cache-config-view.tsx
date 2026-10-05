import { Separator } from '@/components/ui/separator';
import { DiagnosticsData } from '../lib/helper';

interface CacheViewProps {
  data: DiagnosticsData['cache'];
}

export function CacheConfigView({ data }: CacheViewProps) {
  return (
    <>
      <Separator className="my-1" />
      <div className="flex flex-row justify-between">
        <p>Caching Mode:</p> <span>{data.mode}</span>
      </div>
      <div className="flex flex-row justify-between">
        <p>Stale Time (ms):</p>
        <span>{data.staleTime} ms</span>
      </div>
      <div className="flex flex-row justify-between">
        <p>Cache Time (ms):</p>
        <span>{data.gcTime} ms</span>
      </div>
    </>
  );
}
