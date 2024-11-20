import PageWrapper from '@/components/layout/page-wrapper';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import LoadingDisplay from '@/components/ui/loading-display';
import { SavedSessionResult } from '@/lib/dtos';
import { GetResultsFromEvaluationFolder } from '@/lib/files';
import { CleanUpString } from '@/lib/strings';
import { KeySet } from '@/types/keyset';
import { useContext, useEffect, useState } from 'react';
import { FilterByPrimaryRole } from './helpers/filtering';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SessionTerminationOptionsType } from '@/forms/schema/session-designer-schema';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { KeyboardIcon, PointerIcon } from 'lucide-react';
import RateFigureVisualization, { ExpandedKeySetInstance } from './figures/rate-figure';
import { getLocalCachedPrefs, setLocalCachedPrefs } from '@/lib/local_storage';
import createHref from '@/lib/links';
import { useNavigate, useParams } from 'react-router-dom';
import { FolderHandleContext } from '@/context/folder-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ResultsRateVisualsPageShim() {
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
    <ResultsRateVisualsPage
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

function ResultsRateVisualsPage({ Handle, Group, Individual, Evaluation }: Props) {
  const [results, setResults] = useState<SavedSessionResult[]>([]);
  const [keySet, setKeySet] = useState<KeySet>();
  const [filteredKeys, setFilteredKeys] = useState([] as ExpandedKeySetInstance[]);
  const [ctbSumKeys, setCTBSumKeys] = useState([] as ExpandedKeySetInstance[]);
  const [schedule, setSchedule] = useState<SessionTerminationOptionsType>('End on Timer #1');

  useEffect(() => {
    const load_data = async () => {
      const { keyset, results } = await GetResultsFromEvaluationFolder(Handle, Group, Individual, Evaluation);

      setKeySet(keyset);
      setResults(results);

      if (keyset) {
        const keys = keyset.FrequencyKeys.map((key) => ({
          KeyDescription: key.KeyDescription,
          Visible: true,
        }));

        const stored_prefs = getLocalCachedPrefs(Group, Individual, Evaluation, 'Rate');

        const ctb_entry = {
          KeyDescription: 'CTB',
          Visible: true,
        };

        const show_keys_base = [...keys, ctb_entry].map((key) => {
          const should_disable = stored_prefs.KeyDescription.includes(key.KeyDescription);

          if (should_disable) {
            return {
              ...key,
              Visible: false,
            };
          }

          return key;
        });

        const exclude_from_ctb = keys.map((key) => {
          const should_disable = stored_prefs.CTBElements.includes(key.KeyDescription);

          if (should_disable) {
            return {
              ...key,
              Visible: false,
            };
          }

          return key;
        });

        setFilteredKeys(show_keys_base);
        setCTBSumKeys(exclude_from_ctb);
        setSchedule(stored_prefs.Schedule);
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
      label={`${CleanUpString(CleanUpString(Evaluation))}: Target Rates`}
      className="select-none"
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Visualization of Behavioral Rates</CardTitle>
          <CardDescription>Options for Visualizing Data Provided Below</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="w-full flex flex-row justify-between mb-4">
            <div className="flex flex-row gap-4">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-fit">
                    <KeyboardIcon className="mr-2 w-4 h-4" />
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

                        const exclude_from_ctb = ctbSumKeys
                          .filter((k) => k.Visible === false)
                          .map((k) => k.KeyDescription);

                        setLocalCachedPrefs(Group, Individual, Evaluation, 'Rate', {
                          KeyDescription: hidden_keys,
                          CTBElements: exclude_from_ctb,
                          Schedule: schedule,
                        });
                      }}
                    >
                      {key.KeyDescription}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-fit">
                    <PointerIcon className="mr-2 w-4 h-4" />
                    Select Keys for CTB Calculation
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Toggle Inclusion</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {ctbSumKeys.map((key, index) => (
                    <DropdownMenuCheckboxItem
                      key={`key-${index}`}
                      checked={key.Visible}
                      onCheckedChange={(checked: boolean) => {
                        const updatedKeys = ctbSumKeys.map((k) => {
                          if (k.KeyDescription === key.KeyDescription) {
                            return {
                              ...k,
                              Visible: checked,
                            };
                          }

                          return k;
                        });

                        const hidden_keys = filteredKeys
                          .filter((k) => k.Visible === false)
                          .map((k) => k.KeyDescription);

                        const exclude_from_ctb = updatedKeys
                          .filter((k) => k.Visible === false)
                          .map((k) => k.KeyDescription);

                        setLocalCachedPrefs(Group, Individual, Evaluation, 'Rate', {
                          KeyDescription: hidden_keys,
                          CTBElements: exclude_from_ctb,
                          Schedule: schedule,
                        });

                        setCTBSumKeys(updatedKeys);
                      }}
                    >
                      {key.KeyDescription}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-row items-center gap-2 w-fit">
              <p>Select Timer to Reference:</p>
              <Select
                value={schedule}
                onValueChange={(value: SessionTerminationOptionsType) => {
                  setSchedule(value);

                  const hidden_keys = filteredKeys.filter((k) => k.Visible === false).map((k) => k.KeyDescription);

                  const exclude_from_ctb = ctbSumKeys.filter((k) => k.Visible === false).map((k) => k.KeyDescription);

                  setLocalCachedPrefs(Group, Individual, Evaluation, 'Rate', {
                    KeyDescription: hidden_keys,
                    CTBElements: exclude_from_ctb,
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
            This page provides a visual of the available data regarding <i>rate</i>. For convenience, series of data can
            be enabled or disabled for viewing. Similarly, an omnibus measure of behavior can be calculated by selecting
            which types of events to combine together (i.e., a combined target behavior [CTB] metric). Options set here
            will persist for future visits.
          </p>

          {keySet && (
            <RateFigureVisualization
              FilteredSessions={results_filtered}
              ScheduleOption={schedule}
              CTBKeys={ctbSumKeys}
              KeySetFull={filteredKeys}
            />
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
