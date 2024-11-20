import { ExpandedSavedSessionResult } from '../session-viewer-page';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Props = {
  Session: ExpandedSavedSessionResult | undefined;
};

export default function SessionKeyList({ Session }: Props) {
  if (!Session) return <></>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Event</TableHead>
          <TableHead>Timer/Schedule</TableHead>
          <TableHead>Key Information</TableHead>
          <TableHead>Time Into Session</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Session.PlottedKeys.sort((a, b) => a.TimeIntoSession - b.TimeIntoSession).map((k, index) => {
          return (
            <TableRow key={index}>
              <TableCell>{`${k.KeyDescription} (Key = ${k.KeyName})`}</TableCell>
              <TableCell>{k.KeyScheduleRecording}</TableCell>
              <TableCell>{k.KeyType}</TableCell>
              <TableCell>{`${k.TimeIntoSession.toFixed(3)}s (${(k.TimeIntoSession / 60).toFixed(3)} min)`}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
