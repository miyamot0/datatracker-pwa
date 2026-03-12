import PageWrapper from '@/components/layout/page-wrapper';
import UnauthorizedDisplay from './displays/unauthorized-display';
import { FolderHandleContext } from '@/context/folder-context';
import { useContext } from 'react';
import AuthorizedDisplayPage from './views/authorized-display';

export default function DashboardPage() {
  const { handle } = useContext(FolderHandleContext);

  if (!handle) {
    return (
      <PageWrapper label={'Folder Authorization'} className="select-none">
        <UnauthorizedDisplay />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper label={'Group Dashboard'} className="select-none">
      <AuthorizedDisplayPage Handle={handle} />
    </PageWrapper>
  );
}
