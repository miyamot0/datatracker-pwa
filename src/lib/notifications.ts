import { ApplicationSettingsTypes } from "@/types/settings";
import { toast } from "sonner";

/**
 * Display a conditional notification
 *
 * @param settings Application settings
 * @param title Notification title
 * @param description Notification description
 * @param duration Notification duration
 * @param isError Is this an error notification
 */
export function displayConditionalNotification(
  settings: ApplicationSettingsTypes,
  title: string,
  description: string,
  duration?: number,
  isError: boolean = false
) {
  if (isError) {
    toast.error(title, {
      description,
      duration,
    });

    return;
  }

  if (
    settings.NotificationSettings === "ShowNone" ||
    settings.NotificationSettings === "ShowErrorsOnly"
  )
    return;

  toast.success(title, {
    description,
    duration,
  });
}
