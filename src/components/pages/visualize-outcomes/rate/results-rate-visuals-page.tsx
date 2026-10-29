import { lazy } from 'react';
import { SavedSessionResult } from '@/lib/dtos/session-results';
import { Button } from '@/components/ui/button';
import { ScatterChartIcon } from 'lucide-react';
import BackButton from '@/components/ui/back-button';
import { Link } from '@tanstack/react-router';
import {
  VisualsResultsPage,
  type VisualsPageConfig,
  type VisualsResultsPageProps,
} from '@/components/pages/visualize-outcomes/shared/ui/visuals-results-page';

const RATE_CONFIG: VisualsPageConfig = {
  page: 'rate',
  plot: 'Rate',
  prefsType: 'Rate',
  title: 'Visualization of Behavioral Rates',
  includeScoringInSchedule: true,
  Figure: lazy(() => import('./rate-figure')),
};

export default function ResultsRateVisualsPage({
  Group,
  Individual,
  Evaluation,
  ...props
}: VisualsResultsPageProps & {
  Results: SavedSessionResult[];
}) {
  return (
    <VisualsResultsPage
      {...props}
      Group={Group}
      Individual={Individual}
      Evaluation={Evaluation}
      config={RATE_CONFIG}
      actions={
        <>
          <Link
            to={'/session/$group/$individual/$evaluation/proportion'}
            params={{
              group: Group,
              individual: Individual,
              evaluation: Evaluation,
            }}
          >
            <Button variant={'outline'} className="shadow" size={'sm'}>
              <ScatterChartIcon className="mr-2 h-4 w-4" />
              See Proportion
            </Button>
          </Link>

          <BackButton />
        </>
      }
      description={
        <>
          This page provides a visual of the available data regarding <i>rate</i>. For convenience, series of data can
          be enabled or disabled for viewing. Similarly, an omnibus measure of behavior can be calculated by selecting
          which types of events to combine together using the optional logic builder. Options set here will persist for
          future visits.
        </>
      }
    />
  );
}
