---
title: TODO Data File Fields and Types (Advanced)
date: 09/27/2024
keywords: 'Research, Data Analysis/Synthesis'
author: 'Shawn Gilroy'
index: 11
---

TODO: Structure of data files

...

### SessionSettings

Therapist: The name of the therapist conducting the session (e.g., "Shawn").

Initials: The initials of the individual being observed or recorded (e.g., "Test").

Role: The role of the therapist in the session, such as "Primary".

DurationS: The total duration of the session in seconds (e.g., 120).

TimerOption: The timer configuration or setting used for the session (e.g., "End on Timer #1").

Session: The session number (e.g., 1).

KeySet: The name of the keyset used for recording behaviors (e.g., "FA Keyset").

Condition: The experimental condition or context of the session (e.g., "Control").

### FrequencyKeyPresses

This array contains objects detailing each key press related to frequency-type data.

KeyName: The key pressed (e.g., "1").

KeyCode: The code representing the key (e.g., 49).

KeyDescription: Description of the behavior associated with the key (e.g., "Self Injury").

TimePressed: The timestamp of when the key was pressed in ISO 8601 format (e.g., "2024-09-13T16:47:17.683Z").

KeyScheduleRecording: Indicates whether the recording was part of the "Primary" or "Secondary" schedule.

KeyType: Indicates the type of data being recorded, which is "Frequency" in this case.

TimeIntoSession: The elapsed time (in seconds) from the start of the session to the moment the key was pressed (e.g., 7.7).

### DurationKeyPresses

This array contains objects detailing each key press related to duration-type data.

KeyName: The key pressed (e.g., "q").

KeyCode: The code representing the key (e.g., 81).

KeyDescription: Description of the behavior associated with the key (e.g., "Reinforcement").

TimePressed: The timestamp of when the key was pressed in ISO 8601 format (e.g., "2024-09-13T16:47:18.108Z").

KeyScheduleRecording: Indicates whether the recording was part of the "Primary" or "Secondary" schedule.

KeyType: Indicates the type of data being recorded, which is "Duration" in this case.

TimeIntoSession: The elapsed time (in seconds) from the start of the session to the moment the key was pressed (e.g., 8.1).

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
