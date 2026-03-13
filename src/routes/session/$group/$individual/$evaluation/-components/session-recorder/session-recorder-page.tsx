import { FolderHandleContext } from '@/context/folder-context';
import SessionRecorderInterface from './views/session-recorder-interface';
import { fetchConditions } from '@/queries/conditions/query-conditions';
import { useQuery } from '@tanstack/react-query';
import { fetchKeyboards } from '@/queries/keysets/query-keyboards';
import { fetchSessionParams } from '@/queries/session/query-session-params';
import { LoadingDisplay } from '@/components/suspense/loading-display';
import { ErrorDisplay } from '@/components/suspense/error-display';
import { useContext } from 'react';

export default function SessionRecorderPage({
  Group,
  Individual,
  Evaluation,
  KeySet,
}: {
  Group: string;
  Individual: string;
  Evaluation: string;
  KeySet: string;
}) {
  const { handle } = useContext(FolderHandleContext);

  const {
    data: dataCondition,
    isLoading: loadingCondition,
    error: errorCondition,
  } = useQuery({
    queryKey: ['/', Group, Individual, Evaluation, 'conditions'],
    queryFn: () => fetchConditions(handle!, Group, Individual, Evaluation),
    subscribed: false,
  });

  const {
    data: dataKeySets,
    isLoading: loadingKeySets,
    error: errorKeySets,
  } = useQuery({
    queryKey: ['/', Group, Individual, 'keyboards'],
    queryFn: () => fetchKeyboards({ Handle: handle!, Group, Individual }),
    subscribed: false,
  });

  const {
    data: dataSessionParams,
    isLoading: loadingSessionParams,
    error: errorSessionParams,
  } = useQuery({
    queryKey: ['/', Group, Individual, Evaluation, 'settings'],
    queryFn: () => fetchSessionParams({ Handle: handle!, Group, Individual, Evaluation }),
    subscribed: false,
  });

  if (loadingCondition || loadingKeySets || loadingSessionParams) return <LoadingDisplay />;

  if (errorCondition || errorKeySets || errorSessionParams || !dataCondition || !dataKeySets || !dataSessionParams)
    return <ErrorDisplay Text={'An error occurred while preparing recorder.'} />;

  const keySetObj = dataKeySets.find((k) => k.Name == KeySet);

  if (!keySetObj) {
    return <ErrorDisplay Text={'An error occurred while preparing recorder.'} />;
  }

  return (
    <SessionRecorderInterface
      Group={Group}
      Individual={Individual}
      Evaluation={Evaluation}
      Settings={dataSessionParams}
      Keyset={keySetObj}
    />
  );
}
