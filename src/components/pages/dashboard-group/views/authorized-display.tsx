import { FolderHandleContextType } from '@/context/folder-context';
import { fetchGroups } from '@/queries/groups/query-groups';
import { useQuery } from '@tanstack/react-query';
import AuthorizedDisplay from '../displays/authorized-display';
import { LoadingDisplay } from '@/components/suspense/loading-display';
import { ErrorDisplay } from '@/components/suspense/error-display';

export default function AuthorizedDisplayPage({ Context }: { Context: FolderHandleContextType }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/'],
    queryFn: () => fetchGroups(Context),
  });

  if (isLoading) return <LoadingDisplay />;

  if (error || data == undefined) return <ErrorDisplay Text={'An error occurred while fetching groups.'} />;

  return <AuthorizedDisplay Groups={data} Context={Context} />;
}
