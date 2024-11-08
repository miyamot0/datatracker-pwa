import PageWrapper from '@/components/layout/page-wrapper';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SavedSessionResult } from '@/lib/dtos';
import { GetResultsFromEvaluationFolder } from '@/lib/files';
import createHref from '@/lib/links';
import { cn } from '@/lib/utils';
import { ChevronRight, SearchIcon } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useContext } from 'react';
import { useEffect, useState } from 'react';
import { FolderHandleContext } from '@/context/folder-context';
import LoadingDisplay from '@/components/ui/loading-display';
import { CleanUpString } from '@/lib/strings';
import { GenerateSavedFileName } from '@/lib/writer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function DashboardHistoryPageShim() {
  const { handle } = useContext(FolderHandleContext);
  const navigate = useNavigate();

  const { Group, Individual, Evaluation } = useParams();

  useEffect(() => {
    if (!handle) {
      navigate(createHref({ type: 'Dashboard' }), {
        unstable_viewTransition: true,
      });
      return;
    }
  }, [handle, navigate]);

  if (!handle) return <LoadingDisplay />;

  if (!Group || !Individual || !Evaluation) {
    navigate(createHref({ type: 'Dashboard' }), {
      unstable_viewTransition: true,
    });
    return;
  }

  return (
    <DashboardHistoryPage
      Handle={handle}
      Group={CleanUpString(Group)}
      Individual={CleanUpString(Individual)}
      Evaluation={CleanUpString(Evaluation)}
    />
  );
}

type Props = {
  Handle: FileSystemDirectoryHandle;
  Group: string;
  Individual: string;
  Evaluation: string;
};

function DashboardHistoryPage({ Handle, Group, Individual, Evaluation }: Props) {
  const [sessions, setSessionsData] = useState<SavedSessionResult[]>([]);

  useEffect(() => {
    if (!Handle) return;

    const file_puller = async () => {
      const { results } = await GetResultsFromEvaluationFolder(Handle, Group, Individual, Evaluation);

      setSessionsData(
        results.sort(
          (a, b) => new Date(a.SessionSettings.Session).valueOf() - new Date(b.SessionSettings.Session).valueOf()
        )
      );
    };

    file_puller();

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    () => {};
  }, [Handle, Group, Individual, Evaluation]);

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
      ]}
      label={'Session History'}
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>Select Individual Sessions to View More</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p>
            This page provides a summary of the data currently saved on your machine. You may view behavior recorded
            from each session in greater detail by using the 'Inspect Session' button.
          </p>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session (Recorder Role)</TableHead>
                <TableHead>Data Collector</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Total Duration</TableHead>
                <TableHead>Date Recorded</TableHead>
                <TableHead>Termination</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session, index) => (
                <TableRow key={index}>
                  <TableCell className="flex flex-row gap-2">
                    {session.SessionSettings.Session}

                    <p
                      className={cn(
                        'transition-colors bg-transparent rounded-full px-2 text-sm flex items-center w-fit whitespace-nowrap',
                        {
                          'bg-green-600 text-white': session.SessionSettings.Role === 'Primary',
                          'bg-purple-400 text-white': session.SessionSettings.Role === 'Reliability',
                        }
                      )}
                    >
                      {`${session.SessionSettings.Role}`}
                    </p>
                  </TableCell>
                  <TableCell>{session.SessionSettings.Initials}</TableCell>
                  <TableCell>{session.SessionSettings.Condition}</TableCell>
                  <TableCell>
                    {(session.TimerMain / 60).toFixed(2)} {`(${session.TimerMain.toFixed(2)}s)`}
                  </TableCell>
                  <TableCell>{`${new Date(session.SessionEnd).toLocaleDateString()} ${new Date(
                    session.SessionEnd
                  ).toLocaleTimeString()}`}</TableCell>
                  <TableCell>{session.EndedEarly === true ? 'Manual Termination' : 'Planned Termination'}</TableCell>
                  <TableCell className="flex flex-row justify-end">
                    <Link
                      className="flex flex-row items-center"
                      to={createHref({
                        type: 'Evaluation Session Analysis',
                        group: Group,
                        individual: Individual,
                        evaluation: Evaluation,
                        index: GenerateSavedFileName(session.SessionSettings).replaceAll('.json', ''),
                      })}
                    >
                      <Button variant={'outline'} className="shadow" size={'sm'}>
                        <SearchIcon className="mr-2 h-4 w-4" />
                        Inspect Session
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
