import { Separator } from '@/components/ui/separator';
import { DiagnosticsData } from '../lib/helper';

interface EnvironmentViewProps {
  data: DiagnosticsData['issues'];
  userAgent: string;
  recommendations: DiagnosticsData['recommendations'];
}

export function EnvironmentInfoView({ data, userAgent, recommendations }: EnvironmentViewProps) {
  return (
    <>
      <div className="flex flex-row justify-between">
        <p>User Agent:</p> <span>{userAgent}</span>
      </div>
      <Separator className="my-1" />
      <div className="flex flex-row justify-between">
        <p>Issues:</p> <span>{data.count}</span>
      </div>
      {data.count > 0 && (
        <>
          <ul className="list-disc list-inside">
            {data.list.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </>
      )}
      <div className="flex flex-row justify-between">
        <p>Recommendations:</p> <span>{recommendations.count}</span>
      </div>
      {recommendations.count > 0 && (
        <>
          <ul className="list-disc list-inside">
            {recommendations.list.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
