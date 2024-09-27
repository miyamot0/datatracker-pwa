---
title: TODO Data File Fields and Types (Advanced)
date: 09/27/2024
keywords: 'Research, Data Analysis/Synthesis'
author: 'Shawn Gilroy'
index: 11
---

The DataTracker program uses a consistent structure for output files to support consistent parsing as well as flexibility in archiving/compiling outcomes. For example, the systematic format would allow current or future researchers to directly access event-level recording (e.g., times associated with specific targets) rather than relying on aggregated metrics (e.g., rate without specific event-level details).

### Core Session Output Data File

For _all_ output data files, there is a common format that encompasses all information regarding the session. The specifics of the session design can be pulled from the respective `SessionSettings` field.

The structure of individual session data files is provided below:

```ts
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

```ts
{
  /* The number session */
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

### `FrequencyKeyPresses` and `DurationKeyPresses` - Recorded Behavior Keys

Both the `FrequencyKeyPresses` and `DurationKeyPresses` fields are array objects that contain relevant behavioral events. These are similar objects but are handled differently given the practicalities of scoring event vs. duration recording (e.g., total counts vs. cumulative onset-offset sums).

For _each key press_, the following structure will be appended to the respective array.

```ts
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
  KeyType: "Frequency" | "Duration"
  /* The # of seconds since session began */
  TimeIntoSession: number;
}
```

### SystemKeyPresses

This array contains objects detailing system-level key events during the session.

KeyName: The system key pressed (e.g., "Enter" or "Escape").

KeyCode: The code representing the key (e.g., 13 or 0).

KeyDescription: Description of the system event (e.g., "Start of Session" or "End of Session").

TimePressed: The timestamp of when the system key was pressed in ISO 8601 format (e.g., "2024-09-13T16:47:09.970Z").

KeyScheduleRecording: Indicates whether the recording was part of the "Primary" or "Secondary" schedule.

KeyType: Indicates the type of data being recorded, which is "System" in this case.

TimeIntoSession: The elapsed time (in seconds) from the start of the session to the moment the key was pressed (e.g., 0).

### SessionStart

The timestamp indicating the start time of the session in ISO 8601 format (e.g., "2024-09-13T16:47:09.970Z").

### Keyset

Details about the keyset used during the session.

id: Unique identifier for the keyset (e.g., "ab2cdeec-630e-40c1-9610-66244549c758").

Name: The name of the keyset (e.g., "FA Keyset").

FrequencyKeys: An array of objects representing keys used for frequency data:

KeyName: The key assigned (e.g., "1").

KeyDescription: The behavior associated with the key (e.g., "Self Injury").

KeyCode: The code for the key (e.g., 49).

DurationKeys: An array of objects representing keys used for duration data:

KeyName: The key assigned (e.g., "q").

KeyDescription: The behavior associated with the key (e.g., "Reinforcement").

KeyCode: The code for the key (e.g., 81).

createdAt: The timestamp when the keyset was created in ISO 8601 format (e.g., "2024-08-29T15:25:12.812Z").

lastModified: The timestamp of the last modification to the keyset in ISO 8601 format (e.g., "2024-08-29T15:25:12.812Z").

### SessionEnd

The timestamp indicating the end time of the session in ISO 8601 format (e.g., "2024-09-13T16:49:11.505Z").

### EndedEarly

A boolean indicating whether the session ended early (true or false).

### TimerMain

The total time of the main timer in seconds (e.g., 120).

### TimerOne

The elapsed time recorded on timer #1 in seconds (e.g., 61.4).

### TimerTwo

The elapsed time recorded on timer #2 in seconds (e.g., 58.9).

### TimerThree

The elapsed time recorded on timer #3 in seconds (e.g., 0).
