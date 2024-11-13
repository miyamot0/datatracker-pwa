---
title: Creating and Managing Key/Behavior Mappings ("KeySets")
date: 09/03/2024
keywords: 'Key/Behavior Mappings, Frequency Counting, Duration Tracking'
author: 'Shawn Gilroy'
index: 6
---

The **KeySet** functionality offered by Data Tracker allows users to efficiently record and track specific behaviors during observation sessions in real time. By mapping keys on a **KeySet** to particular behaviors (e.g., "1" represents and instance of "Aggression"), the program can be used to perform data collection across multiple targets as behavior occurs. Each **KeySet** (i.e., mappings of keys to behavior, of which there can be multiple) customized to include _two_ types of key/behavior mappings: "Frequency Keys" and "Duration Keys". These mappings help users accurately record behaviors that are best measured either by how often they occur (Frequency) or by how long they last (Duration).

An example of multiple 'KeySets' for a specific client are illustrated below:

<div align="center" width="100%">
    <img src="/docs/keyboards_ui.png" alt="Visual of available keyboards"/>
</div>

### Key/Behavior Mappings for Frequency Measurement

Frequency key/behavior mappings are designed for behaviors that are easily counted and typically occur in discrete instances. For example, in a child behavior intervention study, a user might map the "1" key to record instances of "_Physical_ Aggression" and the "2" key to record instances of "_Verbal_ Aggression." Every time the child hits another person, the user presses the "1" key, and the program logs each occurrence. Every time the child exhibits verbal aggression, the user simply presses the "2" key. DataTracker will log each occurrence to facilitate calculations of behavior rates as well as inter-rater agreement. This method allows for quick and accurate counting of behaviors that are frequent and distinct, providing valuable data on the frequency of specific actions over time.

An example illustration of a **KeySet** containing several Frequency event keys is provided below:

<div align="center" width="100%">
    <img src="/docs/keys_frequency.png" alt="Example of Keys in KeySet (frequency)"/>
</div>

### Key/Behavior Mappings for Duration Measurement

Duration key/behavior mappings, on the other hand, are used for behavior that is better measured by the length in time it occurs rather than by count (e.g., one tantrum lasting 5 minutes vs 1 tantrum lasting 30 minutes). These are typically types of behavior that start and stop, where the duration is a critical aspect of the behavior. For instance, in the same child behavior intervention study, the "D" key might be mapped to "Tantrum Duration." When a tantrum begins, the user presses the "D" key to start recording, and when the tantrum ends, the user presses the key again to stop the recording. The program then calculates and logs the total duration of the tantrum, providing insights into how long such episodes last and whether there is a change in duration over the course of the intervention.

An example illustration of a **KeySet** containing several Frequency event keys is provided below:

<div align="center" width="100%">
    <img src="/docs/keys_duration.png" alt="Example of Keys in KeySet (duration)"/>
</div>

### Reasoning and Rationale for Key/Behavior Mappings

The rationale behind these customizable key/behavior mappings is to streamline the data collection process, allowing for precise and consistent recording of behaviors. By tailoring the **KeySet** to specific individuals and behavior relevant to the study, users can ensure that all relevant targets are accurately documented, facilitating better analysis and more effective intervention. This feature is particularly valuable in behavioral studies, where both the frequency and duration of behaviors can provide critical insights into the effectiveness of an intervention or the progression of a condition.

Any number of keys can be added to a **KeySet**. Individual Frequency or Duration keys can be assigned using the 'Add Key' button in the respective areas. This prompts a dialog that requires a description of the event (e.g., Physical Aggression) and a designated key (e.g., '4').

A visual of the key assignment interface is provided below:

<div align="center" width="100%">
    <img src="/docs/keys_dialog.png" alt="Example of Keys in KeySet (duration)"/>
</div>

As a final note, each **KeySet** (Note: there can be multiple keyboards) is specific to "Individual" and not to "Evaluation". For example, it may be easiest to stick with an **KeySet** from the "Functional Analysis" beginning the "Treatment Evaluation", since data recorders have already been trained on those key/behavior mappings. Ultimately, it is not required to work from a single **KeySet** for individuals and multiple **KeySet** files can be created as necessary.
