import { FolderHandleContext } from '@/context/folder-context';
import { useQuery } from '@tanstack/react-query';
import { conditionQueryOptions } from '@/queries/conditions/query-conditions';
import { keyboardQueryOptions } from '@/queries/keysets/query-keyboards';
import { sessionQueryOptions } from '@/queries/session/query-session-params';
import { LoadingDisplay } from '@/components/suspense/loading-display';
import { ErrorDisplay } from '@/components/suspense/error-display';
import { useContext } from 'react';
import SessionDesignerForm from './views/session-designer-form';

export function SessionDesignerPage({
  Group,
  Individual,
  Evaluation,
}: {
  Group: string;
  Individual: string;
  Evaluation: string;
}) {
  const { handle } = useContext(FolderHandleContext);

  const {
    data: dataCondition,
    isLoading: loadingCondition,
    error: errorCondition,
  } = useQuery(conditionQueryOptions(handle!, Group, Individual, Evaluation));

  const {
    data: dataKeySets,
    isLoading: loadingKeySets,
    error: errorKeySets,
  } = useQuery(keyboardQueryOptions(handle!, Group, Individual));

  const {
    data: dataSessionParams,
    isLoading: loadingSessionParams,
    error: errorSessionParams,
  } = useQuery(sessionQueryOptions(handle!, Group, Individual, Evaluation));

  if (loadingCondition || loadingKeySets || loadingSessionParams) return <LoadingDisplay />;

  if (errorCondition || errorKeySets || errorSessionParams || !dataCondition || !dataKeySets || !dataSessionParams)
    return <ErrorDisplay Text={'An error occurred while fetching session outcomes.'} />;

  return (
    <SessionDesignerForm
      Group={Group}
      Individual={Individual}
      Evaluation={Evaluation}
      Conditions={dataCondition}
      Keysets={dataKeySets}
      SessionSettings={dataSessionParams}
    />
  );
}
