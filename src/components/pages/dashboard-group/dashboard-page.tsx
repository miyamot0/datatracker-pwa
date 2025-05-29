import PageWrapper from '@/components/layout/page-wrapper';
import UnauthorizedDisplay from './displays/unauthorized-display';
import AuthorizedDisplay from './displays/authorized-display';
import { useQueryGroupsFixed } from '@/hooks/groups/useQueryGroups';
import { ApplicationSettingsTypes } from '@/types/settings';
import { FolderHandleContextType } from '@/context/folder-context';
import { useLoaderData } from 'react-router-dom';

type LoaderResult = {
  Settings: ApplicationSettingsTypes;
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
        Settings: ctx.settings,
        Context: ctx,
      } satisfies LoaderResult;
    }

    return {
      AuthStatus: 'Authorized',
      Settings: ctx.settings,
      Context: ctx,
    } satisfies LoaderResult;
  };
};

export default function DashboardPage() {
  const loaderResult = useLoaderData() as LoaderResult;
  const { AuthStatus, Context } = loaderResult;

  const { data, status, error, addGroup, copyDemoData, removeGroups } = useQueryGroupsFixed(Context);

  if (AuthStatus === 'Unauthorized') {
    return (
      <PageWrapper label={'Folder Authorization'} className="select-none">
        <UnauthorizedDisplay />
      </PageWrapper>
    );
  }

  if (status === 'error') return <div>{error}</div>;

  return (
    <PageWrapper label={'Group Dashboard'} className="select-none">
      <AuthorizedDisplay
        Groups={data}
        AddGroup={async () => await addGroup()}
        RemoveGroups={async (groups: string[]) => removeGroups(groups)}
        AddExamples={async () => await copyDemoData()}
      />
    </PageWrapper>
  );
}
