import { groupQueryOptions } from '@/queries/groups/query-groups';
import { useQuery } from '@tanstack/react-query';
import { LoadingDisplay } from '@/components/suspense/loading-display';
import { ErrorDisplay } from '@/components/suspense/error-display';
import AuthorizedDisplayContent from '../gated-displays/authorized-display-content';

export default function AuthorizedDisplayPage({ Handle }: { Handle: FileSystemDirectoryHandle }) {
  const { data, isLoading, error } = useQuery(groupQueryOptions(Handle));

  if (isLoading) return <LoadingDisplay />;

  if (error || data == undefined) return <ErrorDisplay Text={'An error occurred while fetching groups.'} />;

  return <AuthorizedDisplayContent Groups={data} />;
}
