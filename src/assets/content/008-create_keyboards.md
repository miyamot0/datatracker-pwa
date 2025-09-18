---
title: Creating and Managing Key/Behavior Mappings ("KeySets")
description: This documentation entry provides an overview of the KeySet functionality within Data Tracker, including its purpose, structure, and how to create and manage KeySets for efficient data collection.
date: 09/03/2024
keywords: 'Key/Behavior Mappings, Data Organization'
author: 'Shawn Gilroy'
---

The **KeySet** functionality offered by Data Tracker allows users to efficiently record and track specific behaviors during observation sessions in real time. By mapping keys on a **KeySet** to particular behaviors (e.g., "1" represents and instance of "Aggression"), the program can be used to perform data collection across multiple targets as behavior occurs. Each **KeySet** (i.e., mappings of keys to behavior, of which there can be multiple) customized to include _two_ types of key/behavior mappings: "Frequency Keys" and "Duration Keys". These mappings help users accurately record behaviors that are best measured either by how often they occur (Frequency) or by how long they last (Duration).

An example of multiple "KeySets" featured for a specific client are illustrated below:

<div align="center" width="100%">
    <img src="docs/keyboards_ui.png" alt="Visual of available keyboards"/>
</div>

### Key/Behavior Mappings for Frequency Measurement

Frequency key/behavior mappings are designed for behaviors that are easily counted and typically occur in discrete instances. For example, in a child behavior intervention study, a user might map the "1" key to record instances of "_Physical_ Aggression" and the "2" key to record instances of "_Verbal_ Aggression." Every time the child hits another person, the user presses the "1" key, and the program logs each occurrence. Every time the child exhibits verbal aggression, the user simply presses the "2" key. DataTracker will log each occurrence to facilitate calculations of behavior rates as well as inter-rater agreement. This method allows for quick and accurate counting of behaviors that are frequent and distinct, providing valuable data on the frequency of specific actions over time.

An example illustration of a **KeySet** containing several Frequency event keys is provided below. Note: the "Frequency" keys are on the left side of the keyboard, while the "Duration" keys are on the right side of the keyboard.

<div align="center" width="100%">
    <img src="docs/key_set_editor_both.png" alt="Example of Keys in KeySet (frequency)"/>
</div>

### Key/Behavior Mappings for Duration Measurement

Duration key/behavior mappings, on the other hand, are used for behavior that is better measured by the length in time it occurs rather than by count (e.g., one tantrum lasting 5 minutes vs 1 tantrum lasting 30 minutes). These are typically types of behavior that start and stop, where the duration is a critical aspect of the behavior. For instance, in the same child behavior intervention study, the "D" key might be mapped to "Tantrum Duration." When a tantrum begins, the user presses the "D" key to start recording, and when the tantrum ends, the user presses the key again to stop the recording. The program then calculates and logs the total duration of the tantrum, providing insights into how long such episodes last and whether there is a change in duration over the course of the intervention.

An example illustration of a **KeySet** containing several "Duration" event keys is provided below. Note: the "Duration" keys are on the left side of the keyboard, while the "Duration" keys are on the right side of the keyboard.

<div align="center" width="100%">
    <img src="docs/key_set_editor_both.png" alt="Example of Keys in KeySet (duration)"/>
</div>

### Reasoning and Rationale for Key/Behavior Mappings

The rationale behind these customizable key/behavior mappings is to streamline the data collection process, allowing for precise and consistent recording of behavior. By tailoring the **KeySet** to specific individuals and behavior relevant to the study, users can ensure that all relevant targets are accurately documented, facilitating better analysis and more effective intervention. This feature is particularly valuable in behavioral studies, where both the frequency and duration of behaviors can provide critical insights into the effectiveness of an intervention or the progression of a condition.

Any number of keys can be added to a **KeySet**. Individual Frequency or Duration keys can be assigned using the 'Add Key' button in the respective areas. This prompts a dialog that requires a description of the event (e.g., Physical Aggression) and a designated key (e.g., '4'). A visual of the key assignment interface is provided below:

<div align="center" width="100%">
    <img src="docs/keys_dialog.png" alt="Example of Keys in KeySet (duration)"/>
</div>

Although there is considerable flexibility in how many keys can be added to a **KeySet**, a few guidelines are recommended to ensure usability and efficiency. First, not all keys can be used to track behavior (e.g., some are 'reserved' or special functions, such as Escape for ending a session). Second, all keys must be unique within a **KeySet**. For example, if the "1" key is already assigned to "Physical Aggression," it cannot be reassigned to another behavior like "Verbal Aggression." This uniqueness helps prevent confusion during data collection and ensures that each key corresponds to a specific behavior. Lastly, each **KeySet** is specific to an **Individual** but not to **Evaluation**. For example, there may be a similar **KeySet** for a single individual, such between a "Functional Analysis" or a "Treatment Evaluation." In most cases, when a treatment is ready to be evaluated, it may be useful to duplicate a prior **KeySet** and then modify it to reflect the new behaviors or changes in the treatment plan (e.g., adding a key for an alternative response to problem behavior).
