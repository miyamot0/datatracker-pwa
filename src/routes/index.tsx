import PageWrapper from '@/components/elements/page-wrapper';
import HomePage from '@/components/pages/home/home-page';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  loader: ({ context }) => {
    return {
      Settings: context.folderHandleContext.settings,
      SaveSettings: context.folderHandleContext.saveSettings,
      SetSettings: context.folderHandleContext.setSettings,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Settings, SaveSettings, SetSettings } = Route.useLoaderData();

  return (
    <PageWrapper className="flex flex-col gap-6 select-none" Settings={Settings}>
      <HomePage Settings={Settings} SaveSettings={SaveSettings} SetSettings={SetSettings} />
    </PageWrapper>
  );
}
