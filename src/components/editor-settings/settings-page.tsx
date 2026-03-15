import PageWrapper from '@/components/layout/page-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BackButton from '@/components/ui/back-button';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { SettingsTabDisplay } from './views/settings-tab-display';
import { SettingsDisplayEnum } from './types/settings-tab-enums';
import { SettingsTabAdvanced } from './views/settings-tab-advanced';

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
          <Tabs defaultValue={SettingsDisplayEnum.Layout}>
            <div className="w-full flex flex-row justify-center">
              <TabsList className="mb-4">
                <TabsTrigger value={SettingsDisplayEnum.Layout}>{SettingsDisplayEnum.Layout}</TabsTrigger>
                <TabsTrigger value={SettingsDisplayEnum.Advanced}>{SettingsDisplayEnum.Advanced}</TabsTrigger>
              </TabsList>
            </div>
            <SettingsTabDisplay />
            <SettingsTabAdvanced />
          </Tabs>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
