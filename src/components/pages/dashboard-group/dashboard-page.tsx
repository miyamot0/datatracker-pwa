import PageWrapper from '@/components/layout/page-wrapper';
import UnauthorizedDisplay from './displays/unauthorized-display';
import AuthorizedDisplay from './displays/authorized-display';
import useQueryGroups, { useQueryGroupsFixed } from '@/hooks/groups/useQueryGroups';
import { ApplicationSettingsTypes } from '@/types/settings';
import { FolderHandleContextType } from '@/context/folder-context';
import { useLoaderData } from 'react-router-dom';

type LoaderResult = {
  Settings: ApplicationSettingsTypes;
  AuthStatus: 'Authorized' | 'Unauthorized';
  Context: FolderHandleContextType;
};

export const groupsPageLoader = (ctx: FolderHandleContextType) => {
  const { handle } = ctx;

  // @ts-ignore
  return async ({ params, request }) => {
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

  const { data, status, error, addGroup, removeGroup } = useQueryGroupsFixed(Context);

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
        RemoveGroup={(group: string) => removeGroup(group)}
      />
    </PageWrapper>
  );
}
