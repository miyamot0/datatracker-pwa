"use client";

import PageWrapper from "@/components/layout/page-wrapper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderHandleContext } from "@/context/folder-context";
import { useContext } from "react";
import SettingsFormItemWrapper from "./views/settings-form-item-wrapper";
import {
  ApplicationSettingsTypes,
  ELEVATED_PRIVILEGES_OPTIONS,
  ElevatedPrivilegesType,
  ENFORCED_NAMING_OPTIONS,
  EnforceDataFolderType,
  NOTIFICATION_SETTINGS_OPTIONS,
  NotificationSettingsTypes,
  POST_SESSION_BX_OPTIONS,
  PostSessionBxTypes,
  THEME_OPTIONS,
  ThemeTypes,
  TOOL_TIP_OPTIONS,
  ToolTipOptionTypes,
} from "@/types/settings";
import { displayConditionalNotification } from "@/lib/notifications";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { settings, setSettings, saveSettings } =
    useContext(FolderHandleContext);
  const { setTheme, theme } = useTheme();

  return (
    <PageWrapper label="Settings">
      <Card className="w-full">
        <CardHeader className="flex flex-row justify-between">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Application Settings</CardTitle>
            <CardDescription>
              Manage and Update Settings for Data Tracker
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="min-h-96 flex flex-col justify-start gap-6">
          <SettingsFormItemWrapper
            Label="Theme/Display Options"
            Description="Toggle light/dark/system Themes for preference"
          >
            <Select
              value={theme ?? "system"}
              onValueChange={(value: ThemeTypes) => {
                setTheme(value);

                displayConditionalNotification(
                  settings,
                  "Settings updated.",
                  "Settings have been saved."
                );
              }}
            >
              <SelectTrigger className="w-full md:max-w-[250px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {THEME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </SettingsFormItemWrapper>

          <SettingsFormItemWrapper
            Label="After-Session Options"
            Description="Set practices for advancing for each session"
          >
            <Select
              value={settings.PostSessionBx}
              onValueChange={(value: PostSessionBxTypes) => {
                const newSettings = {
                  ...settings,
                  PostSessionBx: value,
                } satisfies ApplicationSettingsTypes;
                setSettings(newSettings);
                saveSettings(newSettings);

                displayConditionalNotification(
                  settings,
                  "Settings updated.",
                  "Settings have been saved."
                );
              }}
            >
              <SelectTrigger className="w-full md:max-w-[250px]">
                <SelectValue placeholder="Select Advancement Option" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {POST_SESSION_BX_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </SettingsFormItemWrapper>

          <SettingsFormItemWrapper
            Label="Notification Settings"
            Description="Set the level of notifications to display"
          >
            <Select
              value={settings.NotificationSettings}
              onValueChange={(value: NotificationSettingsTypes) => {
                const newSettings = {
                  ...settings,
                  NotificationSettings: value,
                } satisfies ApplicationSettingsTypes;
                setSettings(newSettings);
                saveSettings(newSettings);

                displayConditionalNotification(
                  settings,
                  "Settings updated.",
                  "Settings have been saved."
                );
              }}
            >
              <SelectTrigger className="w-full md:max-w-[250px]">
                <SelectValue placeholder="Select Notification Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {NOTIFICATION_SETTINGS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </SettingsFormItemWrapper>

          <SettingsFormItemWrapper
            Label="Privilege Settings"
            Description="Enable deletion of files and folders (Warning: Risk of accidental data loss)"
          >
            <Select
              value={settings.EnableFileDeletion ? "true" : "false"}
              onValueChange={(value: ElevatedPrivilegesType) => {
                const newSettings = {
                  ...settings,
                  EnableFileDeletion: value === "true",
                } satisfies ApplicationSettingsTypes;
                setSettings(newSettings);
                saveSettings(newSettings);

                displayConditionalNotification(
                  settings,
                  "Settings updated.",
                  "Settings have been saved."
                );
              }}
            >
              <SelectTrigger className="w-full md:max-w-[250px]">
                <SelectValue placeholder="Select Privilege Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {ELEVATED_PRIVILEGES_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </SettingsFormItemWrapper>

          <SettingsFormItemWrapper
            Label="Data Folder Naming"
            Description="By default, the appropriate folder must be named 'DataTracker'"
          >
            <Select
              value={settings.EnforceDataFolderName ? "true" : "false"}
              onValueChange={(value: EnforceDataFolderType) => {
                const newSettings = {
                  ...settings,
                  EnforceDataFolderName: value === "true",
                } satisfies ApplicationSettingsTypes;
                setSettings(newSettings);
                saveSettings(newSettings);

                displayConditionalNotification(
                  settings,
                  "Settings updated.",
                  "Settings have been saved."
                );
              }}
            >
              <SelectTrigger className="w-full md:max-w-[250px]">
                <SelectValue placeholder="Select Notification Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {ENFORCED_NAMING_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </SettingsFormItemWrapper>

          <SettingsFormItemWrapper
            Label="Tooltip Instructions"
            Description="Add or disable tooltips for new users"
          >
            <Select
              value={settings.EnableToolTip === true ? "All" : "None"}
              onValueChange={(value: ToolTipOptionTypes) => {
                const newSettings = {
                  ...settings,
                  EnableToolTip: value === "All",
                } satisfies ApplicationSettingsTypes;
                setSettings(newSettings);
                saveSettings(newSettings);

                displayConditionalNotification(
                  settings,
                  "Settings updated.",
                  "Settings have been saved."
                );
              }}
            >
              <SelectTrigger className="w-full md:max-w-[250px]">
                <SelectValue placeholder="Select Notification Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {TOOL_TIP_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </SettingsFormItemWrapper>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
