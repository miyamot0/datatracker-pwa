import { FolderHandleContext } from '@/context/folder-context';
import SessionRecorderInterface from './views/session-recorder-interface';
import { useQuery } from '@tanstack/react-query';
import { keyboardQueryOptions } from '@/queries/keysets/query-keyboards';
import { sessionQueryOptions } from '@/queries/session/query-session-params';
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
    data: dataKeySets,
    isLoading: loadingKeySets,
    error: errorKeySets,
  } = useQuery({
    ...keyboardQueryOptions(handle!, Group, Individual),
    subscribed: false,
  });

  const {
    data: dataSessionParams,
    isLoading: loadingSessionParams,
    error: errorSessionParams,
  } = useQuery({
    ...sessionQueryOptions(handle!, Group, Individual, Evaluation),
    subscribed: false,
  });

  if (loadingKeySets || loadingSessionParams) return <LoadingDisplay />;

  if (errorKeySets || errorSessionParams || !dataKeySets || !dataSessionParams)
    return <ErrorDisplay Text={'An error occurred while fetching parameters.'} />;

  const keySetObj = dataKeySets.find((k) => k.Name == KeySet);

  if (!keySetObj) {
    return <ErrorDisplay Text={'Respective KeySet not found.'} />;
  }

  return (
    <SessionRecorderInterface
      Group={Group}
      Individual={Individual}
      Evaluation={Evaluation}
      Settings={dataSessionParams}
      Keyset={keySetObj}
      Handle={handle!}
    />
  );
}
