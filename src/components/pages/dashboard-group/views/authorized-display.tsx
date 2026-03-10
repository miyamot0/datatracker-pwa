import { FolderHandleContextType } from '@/context/folder-context';
import { fetchGroups } from '@/queries/groups/query-groups';
import { useQuery } from '@tanstack/react-query';
import AuthorizedDisplay from '../displays/authorized-display';

export default function AuthorizedDisplayPage({ Context }: { Context: FolderHandleContextType }) {
  const { data, error } = useQuery({
    queryKey: ['/'],
    queryFn: () => fetchGroups(Context),
  });

  if (error || data == undefined) return <div>{'Error'}</div>;

  return <AuthorizedDisplay Groups={data} Context={Context} />;
}
