import { ApplicationSettingsTypes } from './settings';
import { SessionTerminationOptions } from './terminations';

/**
 * This constant defines the available options for mapping session termination criteria in the application. Each option consists of a `value`, which corresponds to a specific session termination condition defined in the `SessionTerminationOptions` enum, and a `label`, which is a human-readable string that can be displayed in the user interface (e.g., in a dropdown menu) to allow users to select how they want to score or evaluate session outcomes based on different timing criteria. This structure facilitates both type safety and user-friendly interaction when configuring session evaluation settings in the application.
 */
export const ScheduleMappingOptions = [
  {
    value: SessionTerminationOptions.TimerMain,
    label: 'Score Total Time',
  },
  {
    value: SessionTerminationOptions.Timer1,
    label: 'Score Timer #1 Time',
  },
  {
    value: SessionTerminationOptions.Timer2,
    label: 'Score Timer #2 Time',
  },
  {
    value: SessionTerminationOptions.Timer3,
    label: 'Score Timer #3 Time',
  },
];

/**
 * Type for schedule mapping options, derived from the ScheduleMappingOptions constant. This type ensures that any variable of this type can only take on one of the specified values defined in the `ScheduleMappingOptions` array, providing type safety and preventing invalid assignments when configuring session evaluation settings in the application.
 */
export type ScheduleMappingOptionsType = (typeof ScheduleMappingOptions)[number];

// TODO: Map special keys here too
export function filteredSessionScoringOptions(appSettings: ApplicationSettingsTypes, filterMain = false) {
  const options = Object.values(ScheduleMappingOptions);

  return options.filter((option) => {
    if (filterMain && option.value === SessionTerminationOptions.TimerMain) {
      return false;
    }

    if (option.value === SessionTerminationOptions.Timer2 && appSettings.TimerTwoDisplay !== 'show') {
      return false;
    }
    if (option.value === SessionTerminationOptions.Timer3 && appSettings.TimerThreeDisplay !== 'show') {
      return false;
    }

    return true;
  });
}
