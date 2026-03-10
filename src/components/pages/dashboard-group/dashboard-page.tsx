import PageWrapper from '@/components/layout/page-wrapper';
import UnauthorizedDisplay from './displays/unauthorized-display';
import { FolderHandleContextType } from '@/context/folder-context';
import { useLoaderData } from 'react-router-dom';
import AuthorizedDisplayPage from './views/authorized-display';

type LoaderResult = {
  AuthStatus: 'Authorized' | 'Unauthorized';
  Context: FolderHandleContextType;
};

// eslint-disable-next-line react-refresh/only-export-components
export const groupsPageLoader = (ctx: FolderHandleContextType) => {
  const { handle } = ctx;

  return async () => {
    if (!handle) {
      return {
        AuthStatus: 'Unauthorized',
        Context: ctx,
      } satisfies LoaderResult;
    }

    return {
      AuthStatus: 'Authorized',
      Context: ctx,
    } satisfies LoaderResult;
  };
};

export default function DashboardPage() {
  const loaderResult = useLoaderData() as LoaderResult;
  const { AuthStatus, Context } = loaderResult;

  if (AuthStatus === 'Unauthorized') {
    return (
      <PageWrapper label={'Folder Authorization'} className="select-none">
        <UnauthorizedDisplay />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper label={'Group Dashboard'} className="select-none">
      <AuthorizedDisplayPage Context={Context} />
    </PageWrapper>
  );
}
