import PageWrapper from '@/components/layout/page-wrapper';
import UnauthorizedDisplay from './displays/unauthorized-display';
import AuthorizedDisplay from './displays/authorized-display';
import useQueryGroups from '@/hooks/groups/useQueryGroups';

export default function DashboardPage() {
  const { data, status, error, handle, addGroup, removeGroup } = useQueryGroups();

  if (status === 'loading')
    return (
      <PageWrapper label={'Folder Authorization'} className="select-none">
        <UnauthorizedDisplay />
      </PageWrapper>
    );

  if (status === 'error' || !handle) return <div>{error}</div>;

  return (
    <PageWrapper label={'Group Dashboard'} className="select-none">
      <AuthorizedDisplay
        Groups={data}
        AddGroup={async () => await addGroup()}
        RemoveGroup={(group: string) => removeGroup(group)}
      />
    </PageWrapper>
  );
}
