import PageWrapper from '@/components/layout/page-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BackButton from '@/components/ui/back-button';
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs';
import { SettingsTabDisplay } from './views/settings-tab-display';
import { SettingsTabIO } from './views/settings-tab-io';
import { SettingsTabNotifications } from './views/settings-tab-notifications';
import { SettingsTabAdministrative } from './views/settings-tab-admin';
import { SettingsDisplayEnum } from '@/types/settings';

export default function SettingsPage() {
  return (
    <PageWrapper label="Settings" className="select-none">
      <Card className="w-full">
        <CardHeader className="flex flex-row justify-between">
          <div className="flex flex-col gap-1.5 grow">
            <CardTitle>Application Settings</CardTitle>
            <CardDescription>Manage and Update Settings for Data Tracker</CardDescription>
          </div>
          <BackButton />
        </CardHeader>

        <CardContent className="min-h-80 flex flex-col justify-start gap-6">
          <Tabs defaultValue={SettingsDisplayEnum.Display}>
            <div className="w-full flex flex-row justify-center border-b mb-4">
              <TabsList className="mb-4">
                <TabsTrigger value={SettingsDisplayEnum.Display}>{SettingsDisplayEnum.Display}</TabsTrigger>
                <TabsTrigger value={SettingsDisplayEnum.Notifications}>{SettingsDisplayEnum.Notifications}</TabsTrigger>
                <TabsTrigger value={SettingsDisplayEnum.File}>{SettingsDisplayEnum.File}</TabsTrigger>
                <TabsTrigger value={SettingsDisplayEnum.Admin}>{SettingsDisplayEnum.Admin}</TabsTrigger>
              </TabsList>
            </div>
            <SettingsTabDisplay />
            <SettingsTabNotifications />
            <SettingsTabIO />
            <SettingsTabAdministrative />
          </Tabs>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
