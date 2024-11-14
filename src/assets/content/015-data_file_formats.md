---
title: Data File Fields and Types (Advanced)
date: 09/27/2024
keywords: 'Data Organization, Data Export, Data Parsing'
author: 'Shawn Gilroy'
---

The DataTracker program uses a consistent structure for output files to support consistent parsing as well as flexibility in archiving/compiling outcomes. For example, the systematic format would allow current or future researchers to directly access event-level recording (e.g., times associated with specific targets) rather than relying on aggregated metrics (e.g., rate without specific event-level details).

### Core Session Output Data File

For _all_ output data files, there is a common format that encompasses all information regarding the session. The specifics of the session design can be pulled from the respective `SessionSettings` field.

The structure of individual session data files is provided below:

```js
{
  /* Session Designer Settings */
  SessionSettings: SavedSettings;

  /* Particulars of the --current-- keyset for session */
  Keyset: KeySet;

  /* Keys recorded specific to system events (e.g., schedules)  */
  SystemKeyPresses: KeyManageType[];

  /* Keys recorded specific to frequency events */
  FrequencyKeyPresses: KeyManageType[];

  /* Keys recorded specific to duration events */
  DurationKeyPresses: KeyManageType[];

  /* Timestamp for when session started */
  SessionStart: string;

  /* Timestamp for when session concluded */
  SessionEnd: string;

  /* Flag for logging if session ended manually */
  EndedEarly: boolean;

  /* Duration for the Overall Session */
  TimerMain: number;

  /* Duration for the Primary/First Timer */
  TimerOne: number;

  /* Duration for the Secondary/Second Timer */
  TimerTwo: number;

  /* Duration for the Tertiary/Third Timer */
  TimerThree: number;
}
```

### `SessionSettings` - Features of the Session and its Design

The `SessionSettings` field of the data object features all of the information needed to contextualized the behavior recorded. It is necessary to highlight that the Group/Individual/Evaluation information is not contained here and this is by design. These parameters are _inherited_ by the local filesystem, so parsers would simply pipe such information as necessary.

Members of the `SessionSettings` field are noted below:

```js
{
  /* The number for the session */
  Session: number;

  /* The condition name */
  Condition: string;

  /* The duration of programmed session */
  DurationS: number;

  /* The primary timer of interest */
  TimerOption: 'End on Primary Timer' | 'End on Timer #1' | 'End on Timer #2' | 'End on Timer #3';

  /* Session therapy initials/name */
  Therapist: string;

  /* Data collector initials/name */
  Initials: string;

  /* Name of assigned keyset */
  KeySet: string;

  /* The role served by data collector */
  Role: 'Primary' | 'Reliability';
}
```

### `FrequencyKeyPresses`, `DurationKeyPresses`, and `SystemKeyPresses` - Recorded Behavior Keys

The `FrequencyKeyPresses`, `DurationKeyPresses`, and `SystemKeyPresses` fields are array objects that contain relevant system and behavioral events. These are similar objects but are handled differently given the practicalities of scoring event vs. duration recording (e.g., total counts vs. cumulative onset-offset sums) and system events (e.g., onset vs. end of session/schedule).

For _each key press_, the following structure will be appended to the respective array.

```js
{
  /* Named letter/symbole associated with key */
  KeyName: string;

  /* Code assigned to respective key */
  KeyCode: The code representing the key (e.g., 49).

  /* Label supplied to describe the key (e.g., Aggression) */
  KeyDescription: string;

  /* The timestamp of when the key was pressed in ISO 8601 format (e.g., "2024-09-13T16:47:17.683Z"). */
  TimePressed: string;

  /* The schedule in white the keypress was recorded */
  KeyScheduleRecording: "Primary" | "Secondary" | "Tertiary"

  /* The type of event associated with key */
  KeyType: "Frequency" | "Duration" | "System" | "Timing"

  /* The # of seconds since session began */
  TimeIntoSession: number;
}
```

### `KeySet` - Fields Included in the Keyset

The `KeySet` field is a simple object that contains the details of the keyset used during the session. This includes the name of the keyset, the keys used for frequency data, the keys used for duration data, and the timestamps of when the keyset was created and last modified.

```js
{
  /* Unique identifier for the keyset */
  id: string;

  /* The name of the keyset */
  Name: string;

  /* Array of objects representing keys used for frequency data */
  FrequencyKeys: KeyManageType[];

  /* Array of objects representing keys used for duration data */
  DurationKeys: KeyManageType[];

  /* Timestamp when the keyset was created */
  createdAt: string;

  /* Timestamp of the last modification to the keyset */
  lastModified: string;
}
```

### Miscellaneous Fields Individual

The `SessionStart`, `SessionEnd`, `EndedEarly`, `TimerMain`, `TimerOne`, `TimerTwo`, and `TimerThree` fields are all straightforward and provide the necessary information to understand the session's duration and any potential interruptions.

```js
{
  /* Timestamp indicating the start time of the session */
  SessionStart: string;

  /* Timestamp indicating the end time of the session */
  SessionEnd: string;

  /* Boolean indicating whether the session ended early */
  EndedEarly: boolean;

  /* Total time of the main timer in seconds */
  TimerMain: number;

  /* Elapsed time recorded on timer #1 in seconds */
  TimerOne: number;

  /* Elapsed time recorded on timer #2 in seconds */
  TimerTwo: number;

  /* Elapsed time recorded on timer #3 in seconds */
  TimerThree: number;
}
```
