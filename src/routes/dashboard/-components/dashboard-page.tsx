import PageWrapper from '@/components/layout/page-wrapper';
import UnauthorizedDisplay from './dash/displays/unauthorized-display';
import { FolderHandleContext } from '@/context/folder-context';
import { useContext } from 'react';
import AuthorizedDisplayPage from './dash/views/authorized-display';

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
