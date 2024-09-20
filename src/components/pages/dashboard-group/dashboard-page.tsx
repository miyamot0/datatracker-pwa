import PageWrapper from '@/components/layout/page-wrapper';
import { FolderHandleContext } from '@/context/folder-context';
import { useContext, useEffect, useState } from 'react';
import UnauthorizedDisplay from './displays/unauthorized-display';
import AuthorizedDisplay from './displays/authorized-display';
import { getGroupFolders } from '@/lib/files';
import { LoadingStructure } from '@/types/working';
import LoadingDisplay from '@/components/ui/loading-display';

export default function DashboardPage() {
  const { handle } = useContext(FolderHandleContext);
  const [groups, setGroups] = useState<LoadingStructure>({
    Status: 'loading',
    Values: [],
  });

  useEffect(() => {
    if (handle) {
      getGroupFolders(handle, setGroups);
    }
    return () => {};
  }, [handle]);

  if (handle && groups.Status === 'loading') {
    return <LoadingDisplay />;
  }

  return (
    <PageWrapper label={handle ? 'Group Dashboard' : 'Folder Authorization'} className="select-none">
      {!handle ? (
        <UnauthorizedDisplay />
      ) : (
        <AuthorizedDisplay Handle={handle} Groups={groups} AddCallback={setGroups} />
      )}
    </PageWrapper>
  );
}
