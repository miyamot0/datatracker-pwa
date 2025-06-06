---
title: Recording Behavior using Session Recorder Page
description: This documentation entry provides an overview of the Session Recorder page within DataTracker, including its purpose, structure, and how to record behaviors and manage timers during observation sessions.
date: 09/26/2024
keywords: 'Data Collection, Session Conditions'
author: 'Shawn Gilroy'
---

The **Session Recorder** page is the main interface for actively collecting data in real-time. This page pulls the parameters set in the **Session Designer**, such as the **Keyboard** (i.e., behavior/key mappings) and the duration of total session (i.e., under which conditions sessions are planned to end). Once the session begins, the data collector uses the pre-defined keys defined in the **KeySet** to log behaviors and those outlined in the UI to manage timers in real-time. An example of a hypothetical session ready to begin is displayed below:

<div align="center" width="100%">
    <img src="/docs/session_recorder.png" alt="Image of DataTracker session recorder page"/>
</div>

### Beginning and Ending the Session

The session will begin when the data collector presses the 'Enter' key, which activates all the parameters configured in the **Session Designer**. That is, pressing 'Enter' will start the session timer and prepare the interface for data collection. The **Session Recorder** page will then display the current session status, including the active timers and any ongoing behaviors being recorded. Once the session has begun, the data collector can start recording behavior. The session will continue until the user presses the 'Escape' key or until the termination criteria set in the **Session Designer** are met (e.g., after 300s of total session time).

The session can be terminated via either some planned criteria (e.g., based on session time) or some other unplanned criteria (e.g., some need to terminate the session earlier than usual). Users can press the 'Escape' key at any time to end the session immediately. This action will stop all timers and prompt the data collector to decide whether to keep or discard the recorded data. If the user chooses to keep the data, it will be saved in the **Evaluation** folder for later analysis; if not, all recorded data will be discarded, and no further data will be collected from that point onward.

### Recording Behavioral Targets

The **Session Recorder** provides the data collector with information on all relevant keys and behavior mapped in the **Keyboard**. For example, if the data collector is observing a child for instances of "Verbal Aggression" and the duration of "Tantrums," these behaviors are mapped to specific keys (e.g., "F" for Verbal Aggression and "D" for Tantrum Duration). The data collector can press these keys to record each instance of the behavior or start/stop the duration timer for the behavior. This process is seamlessly integrated with the timers, ensuring that behaviors are accurately recorded in relation to the ongoing time frames. For ease of operation, 'active' or 'ongoing' targets (e.g., tantrum episodes) are highlighted in green to illustrate that an ongoing event is being recorded.

### Managing Timers

Throughout the session, the data collector can actively manage up to three timers using the 'Z', 'X', and 'C' keys. These timers correspond to the Primary (#1), Secondary (#2), and Tertiary timers (#3), respectively. The Primary Timer (Timer #1; e.g., 'work' or 'session' timer) is typically used to track the overall session duration, while the Secondary Timer (Timer #2) and Tertiary Timer (Timer #3) can be used to monitor other time-sensitive behaviors or events. For example, Timer #2 might track the duration of a context (e.g., time related to reinforcer delivery is handled/addressed separately). The data collector can start and stop each timer independently using the designated keys, ensuring that multiple time frames are accurately recorded during the session.

### Procedures for Terminating Session

The session concludes when the predefined termination criteria are met, as set in the **Session Designer**. This could occur when the 'Total Time' reaches the session duration limit, or when any of the timers (Timer #1, #2, or #3) meets the specified criteria. For example, if the session is set to end after 10 minutes for Timer #1, the session will automatically conclude when Timer #1 hits 600 seconds. Alternatively, in the case that session time is open-ended, the session can be concluded at any time; however, the user must indicate that they wish to _keep_ a 'partial' session and its data.

## Summary and Overview

The **Session Recording** page is the heart of the DataTracker program. It provides a straightforward 'heads-up' display that allows data collectors to efficiently record behaviors and manage timers during observation sessions. By integrating the parameters set in the **Session Designer**, this page ensures that all data is accurately captured and organized in real-time. The user-friendly interface simplifies the data collection process, allowing researchers and clinicians to focus on the observation and analysis of participant behaviors without the need for manual data entry or post-session data processing.

Data recorded at the end of the session (if not discarded) is managed and stored in the respective location within the **Evaluation** folder. This data can then be accessed for further analysis, comparison, and interpretation, providing valuable insights into the behavior of participants over time.
