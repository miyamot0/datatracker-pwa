import { groupQueryOptions } from '@/queries/groups/query-groups';
import { useQuery } from '@tanstack/react-query';
import AuthorizedDisplay from '../displays/authorized-display-content';
import { LoadingDisplay } from '@/components/suspense/loading-display';
import { ErrorDisplay } from '@/components/suspense/error-display';

export default function AuthorizedDisplayPage({ Handle }: { Handle: FileSystemDirectoryHandle }) {
  const { data, isLoading, error } = useQuery(groupQueryOptions(Handle));

  if (isLoading) return <LoadingDisplay />;

  if (error || data == undefined) return <ErrorDisplay Text={'An error occurred while fetching groups.'} />;

  return <AuthorizedDisplay Groups={data} />;
}
