import PageWrapper from '@/components/layout/page-wrapper';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import LoadingDisplay from '@/components/ui/loading-display';
import { SessionTerminationOptionsType } from '@/forms/schema/session-designer-schema';
import { SavedSessionResult } from '@/lib/dtos';
import { GetResultsFromEvaluationFolder } from '@/lib/files';
import { CleanUpString } from '@/lib/strings';
import { KeySet } from '@/types/keyset';
import { useContext, useEffect, useState } from 'react';
import { FilterByPrimaryRole } from './helpers/filtering';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Edit3Icon } from 'lucide-react';
import { ExpandedKeySetInstance } from './figures/rate-figure';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getLocalCachedPrefs, setLocalCachedPrefs } from '@/lib/local_storage';
import { FolderHandleContext } from '@/context/folder-context';
import { useNavigate, useParams } from 'react-router-dom';
import createHref from '@/lib/links';
import ProportionFigureVisualization from './figures/proportion-figure';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ResultsProportionVisualsPageShim() {
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
    <ResultsProportionVisualsPage
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

export function ResultsProportionVisualsPage({ Handle, Group, Individual, Evaluation }: Props) {
  const [results, setResults] = useState<SavedSessionResult[]>([]);
  const [keySet, setKeySet] = useState<KeySet>();

  const [filteredKeys, setFilteredKeys] = useState([] as ExpandedKeySetInstance[]);

  const [schedule, setSchedule] = useState<SessionTerminationOptionsType>('End on Timer #1');

  useEffect(() => {
    const load_data = async () => {
      const { keyset, results } = await GetResultsFromEvaluationFolder(Handle, Group, Individual, Evaluation);

      setKeySet(keyset);
      setResults(results);

      if (keyset) {
        const keys = keyset.DurationKeys.map((key) => ({
          KeyDescription: key.KeyDescription,
          Visible: true,
        }));

        const stored_prefs = getLocalCachedPrefs(Group, Individual, Evaluation, 'Duration');

        const show_keys_base = keys.map((key) => {
          const should_disable = stored_prefs.KeyDescription.includes(key.KeyDescription);

          if (should_disable) {
            return {
              ...key,
              Visible: false,
            };
          }

          return key;
        });

        setFilteredKeys(show_keys_base);
        setSchedule(stored_prefs.Schedule ?? 'End on Timer #1');
      }
    };

    load_data();
  }, [Handle, Group, Individual, Evaluation]);

  const results_filtered = FilterByPrimaryRole(results);

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(CleanUpString(Group)),
        BuildEvaluationsBreadcrumb(CleanUpString(Group), CleanUpString(Individual)),
      ]}
      label={`${CleanUpString(CleanUpString(Evaluation))}: Interval Proportions`}
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Visualization of Behavioral Rates</CardTitle>
          <CardDescription>Options for Visualizing Data Provided Below</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="w-full flex flex-row justify-between mb-4">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-fit">
                  <Edit3Icon className="mr-2 w-4 h-4" />
                  Edit Keys Displayed
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Toggle Visibility</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filteredKeys.map((key, index) => (
                  <DropdownMenuCheckboxItem
                    key={`key-${index}`}
                    checked={key.Visible}
                    onCheckedChange={(checked) => {
                      const updatedKeys = filteredKeys.map((k) => {
                        if (k.KeyDescription === key.KeyDescription) {
                          return {
                            ...k,
                            Visible: checked,
                          };
                        }

                        return k;
                      });

                      setFilteredKeys(updatedKeys);

                      const hidden_keys = updatedKeys.filter((k) => k.Visible === false).map((k) => k.KeyDescription);

                      setLocalCachedPrefs(Group, Individual, Evaluation, 'Duration', {
                        KeyDescription: hidden_keys,
                        CTBElements: [],
                        Schedule: schedule,
                      });
                    }}
                  >
                    {key.KeyDescription}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex flex-row items-center gap-2 w-fit">
              <p>Select Timer to Reference:</p>
              <Select
                value={schedule}
                onValueChange={(value: SessionTerminationOptionsType) => {
                  setSchedule(value);

                  const hidden_keys = filteredKeys.filter((k) => k.Visible === false).map((k) => k.KeyDescription);

                  setLocalCachedPrefs(Group, Individual, Evaluation, 'Duration', {
                    KeyDescription: hidden_keys,
                    CTBElements: [],
                    Schedule: value,
                  });
                }}
              >
                <SelectTrigger className="w-fit">
                  <SelectValue placeholder="Data Collector Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={'End on Timer #1' as SessionTerminationOptionsType}>
                      Score on Timer #1 Time
                    </SelectItem>
                    <SelectItem value={'End on Timer #2' as SessionTerminationOptionsType}>
                      Score on Timer #2 Time
                    </SelectItem>
                    <SelectItem value={'End on Timer #3' as SessionTerminationOptionsType}>
                      Score on Timer #3 Time
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <p>
            This page provides a visual of the available data regarding <i>prooprtion of session time</i>. For
            convenience, series of data can be enabled or disabled for viewing. Options set here will persist for future
            visits.
          </p>

          {keySet && (
            <ProportionFigureVisualization
              FilteredSessions={results_filtered}
              ScheduleOption={schedule}
              KeySetFull={filteredKeys}
            />
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
