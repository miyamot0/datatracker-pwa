import { lazy } from 'react';
import { SavedSessionResult } from '@/lib/dtos/session-results';
import { Button } from '@/components/ui/button';
import { ScatterChartIcon } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import BackButton from '@/components/ui/back-button';
import {
  VisualsResultsPage,
  type VisualsPageConfig,
  type VisualsResultsPageProps,
} from '@/components/pages/visualize-outcomes/shared/ui/visuals-results-page';

const PROPORTION_CONFIG: VisualsPageConfig = {
  page: 'proportion',
  plot: 'Proportion',
  prefsType: 'Duration',
  title: 'Visualization of Behavioral Proportions',
  includeScoringInSchedule: false,
  Figure: lazy(() => import('@/components/pages/visualize-outcomes/proportion/proportion-figure')),
};

export default function ResultsProportionVisualsPage({
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
      config={PROPORTION_CONFIG}
      actions={
        <>
          <Link
            to={'/session/$group/$individual/$evaluation/rate'}
            params={{
              group: Group,
              individual: Individual,
              evaluation: Evaluation,
            }}
          >
            <Button variant={'outline'} className="shadow" size={'sm'}>
              <ScatterChartIcon className="mr-2 h-4 w-4" />
              See Rate
            </Button>
          </Link>
          <BackButton />
        </>
      }
      description={
        <>
          This page provides a visual of the available data regarding <i>proportion of session time</i>. For convenience,
          series of data can be enabled or disabled for viewing. Options set here will persist for future visits.
        </>
      }
    />
  );
}
