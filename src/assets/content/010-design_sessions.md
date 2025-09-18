---
title: Customizing Session Parameters using Session Designer Page
description: This documentation entry provides an overview of the Session Designer interface within DataTracker, including its purpose, structure, and how to customize session parameters for efficient data collection.
date: 09/26/2024
keywords: 'Session Designer, Session Conditions'
author: 'Shawn Gilroy'
---

The **Session Designer** is a critical element of the DataTracker program. This interface allows users to set up and customize details for a specific type of session. This interface is designed to be used in relation to a particular **Evaluation** folder, which enabling users to configure the necessary parameters for recording and analyzing behavior during a session for that **Evaluation** (e.g., "Control" vs. "Test" **Condition**). The **Session Designer** is where users can define the session's structure (e.g., duration of session, how it should conclude), so that aspects of the data collection process are aligned with the study's goals and requirements. As a general default, the **Session Designer** supports the user by caching session parameters to simplify operations, such as incrementing session numbering after each session and automatically populating prior parameters.

An illustration of a hypothetical session is displayed below:

<div align="center" width="100%">
    <img src="docs/session_designer.png" alt="Image of DataTracker session design page"/>
</div>

### Adding/Selection Evaluation Condition

The first step in the **Session Designer** is selecting the relevant **Condition**. This corresponds with the various conditions outlined in the study/treatment protocol. This dropdown menu allows users to choose from conditions outlined by the user, such as "Baseline" or "Intervention". For example, if the session involves observing a child under the "Intervention" condition, the user would select this option to ensure that all data recorded during the session is associated with the correct experimental context. This ensures that the data collected can be accurately compared with other sessions under different conditions.

If a necessary condition is not present, the user will need to add a new condition to the list using the "Add Condition" button provided on the upper right of **Session Designer** page.

### Choosing the Keyboard Configuration

The next step involves selecting the appropriate **Keyboard** configuration the session. This involves choosing a pre-defined **Keyboard** that maps specific keys to behaviors, as described earlier. Specifically, any of the mappings relevant to the current individual can be selected. To assist in confirming that the correct **Keyboard** is selected, the user is presented with the relevant mappings within the **Session Designer** page. This ensures that the data collected during the session is accurately categorized and recorded according to the specified key/behavior mappings. As a note, key/behavior mappings cannot be changed on this screen and this must be done in another, more specialized part of the application.

### Specifying the Session Therapist

The **Session Designer** allows for the data collector to specify the **Session Therapist** in the "Session Therapist ID" field. As a general practice, this is often simply the initials of the session therapist (e.g., "SPG"). This is important for maintaining accurate records of who is administering the intervention. For example, if "SPG" is conducting the session, this ID would be entered into the relevant text field to link the session data with that specific therapist. This can be particularly important in studies where different therapists may vary in some dimension relevant to a tracked behavior (e.g., larger therapist size, male vs. female).

### Specifying the Data Collector and Role

The **Session Designer** also allows for the identification of the **Data Collector** in the "Data Collector ID" field. This ensures that there is a record of who was performed the data collection, which is essential for accountability and reliability (e.g., if 'drift' in recording has taken place for a data collector). In practice, this is also often the initials of the data collector (e.g., "Collector_002"). This is especially important in cases where multiple data collectors (i.e., more than two) are involved in a case or study.

In addition, the **Data Collector Role** for the current data collector is also specified in the **Session Designer**. The user must indicate whether they are serving as the **Primary Data Collector** or as a **Reliability Data Collector**. The **Primary Data Collector** is the main person responsible for recording data, whereas a **Reliability Data Collector** is used to explore the accuracy and consistency of data recording. It is critical that the user selects the correct role for the data collector, as calculations of observer agreement (discussed elsewhere) focus on evaluating correspondence between a "Primary" and a "Reliability" record.

### Setting the Session Duration

Users can also define the **Session Duration** by specifying the duration of the session in seconds (e.g., 600s = 10 minutes). This parameter sets the total time for the session, which helps to standardize the length of session. For example, if the session is intended to last 600 seconds (10 minutes), this value is entered to ensure that all data collected fits within this time frame, providing a consistent basis for comparison with other sessions (e.g., consistent interpretation of 'rates', with common amount of time).

### Setting Session Termination Rules

The user must specify how the session should terminate by selecting _which_ timer should be used to conclude the session (e.g., Total time reaching **Session Duration** vs. Timer #1 reaching **Session Duration**). By default, the option for "End on Primary Timer" means that the session will conclude when the primary timer reaches the session duration. However, DataTracker provides multiple timers that can be used to end session under specific conditions, allowing for flexibility in how the session is terminated. This ensures that the session ends at the appropriate time based on the specific requirements of the study.

For example, it may be necessary to distinguish between "time spent working" from "time when reinforcers were being accessed/consumed." In this example, Timer #1 (the 'main timer') would correspond with 'work time' and another timer (e.g., Timer #2) would correspond with 'reinforcement time.' In this arrangement, one might choose to have the session 'End on Timer #1' meeting the session duration, since it would separate out 'work time' from 'reinforcement time' in the calculations of behavior rates.

DataTracker allows for the use of up to _three_ timers; with each timer providing flexibility in the customization of session termination rules. These are purely optional and useful insofar as they meet the specific needs of studies and evaluations.

### Session Numbering

The **Session Number** field allows the user to specify which session is being conducted. This is useful because participants undergo multiple sessions over time and this allows for a visualization of behavior changes over time. For example, if this is the second session for a participant, the user would enter "2" to clearly identify the position in the sequence of data.

Additionally, DataTracker will attempt to 'remember' sessions and increment the session number automatically. This numbering helps in tracking progress and minimizing the risk of human error.

## Conclusion and Summary

The Session Designer is a comprehensive tool that provides users with the flexibility and control needed to set up each session accurately. By carefully configuring each aspect of the session, from condition selection to session termination, researchers can ensure that their data collection process is precise, consistent, and tailored to the specific requirements of their study.
