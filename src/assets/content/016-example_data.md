---
title: Previewing DataTracker with Mock Data
description: Example data is provided in the DataTracker program to preview the visualization functionality, sync behavior, and calculations of inter-observer agreement (IOA). This guide provides an overview of this material and how it can be used to support evaluations of the software for various purposes.
date: 05/22/2025
keywords: 'Data Organization, New Users'
author: 'Shawn Gilroy'
---

The DataTracker web app provides a wide range of functionality beyond simple data collection. This includes visualization of data, syncing with other devices, and calculating inter-observer agreement (IOA) for data collected. Much of this functionality cannot be readily explored until sufficient data are available (across multiple raters) and example data are provided to assist users in determining whether DataTracker fits their applied/research needs.

### Loading Example (Mock) Group Data

Functionality for loading the 'Example' group data is available on the _Group_ directory listing page. As a reminder, users must authorize access to their 'DataTracker' folder in order to read or write relevant data. Once authorized, users can select the "Extract Example Folder" button to load the relevant example data to the current Group directory. As a note, the example group name is "Example DataTracker Group" and the copy functionality will fail if a group with that name already exists.

This operation will copy numerous files to this folder and make take a moment to fully copy all the necessary files to this location. Once it is complete, a success message will indicate that the example data have been copied to the current group directory. The example data will be available in the _Group_ directory listing page and can be opened like any other group data (i.e., the "Example DataTracker Group" folder will have a new entry).

<div align="center" width="100%">
    <img src="/docs/extract_demo_data.png" alt="Image of mock data import functionality"/>
</div>

### Exploring Relevant Functionality

The example data provided in the DataTracker program is designed to allow users to explore the functionality of the software without needing to collect their own data. A range of suggested activities are provided below to assist users in exploring the functionality of DataTracker. These activities are not exhaustive and users are encouraged to explore the software as they see fit.

#### Data Visualization

There is one participant included in the example data and these data include a range of relevant evaluations. There is a modified functional analysis provided which includes a range of conditions (e.g., attention, escape, alone, play) and a range of relevant target behaviors (e.g., aggression, self-injury). Clicking on the "Analyze Frequency Data" option on this record will allow users to visualize the data in various ways. Most often, analysts will wish to create a relevant response class using the Combined Target Behavior (CTB) series and the visualization functionality supports this.

The interface is designed to be flexible and allow analysts to visualize various targets, or if more relevant, visualize a simpler figure that aggregates behavior presumed to be functionally related. Using the included example data from a mock functional analysis, users can visualize the data in a variety of ways. An example of this output is provided below.

<div align="center" width="100%">
    <img src="/docs/demo_fa_ctb.png" alt="Image of example functional analysis figure"/>
</div>

#### Rater Agreement Calculations

The example dataset provided in DataTracker also allows for an inspection of the inter-observer agreement (IOA) calculations. The example data includes a range of IOA calculations including total count, interval-by-interval, and occurrence/non-occurrence. The example data also includes a range of relevant target behaviors (e.g., aggression, self-injury) and the IOA calculations can be explored for these behaviors as well.

Using the example data, users can evaluate how the program calculates and displays IOA for each target behavior. The IOA calculations are provided in a table format that includes the total count, interval-by-interval, and occurrence/non-occurrence calculations. An example of this output is provided below.

<div align="center" width="100%">
    <img src="/docs/demo_fa_reli.png" alt="Image of example functional analysis reliability calculations"/>
</div>

#### Syncing with Other Devices

The example data provided in DataTracker will also let users explore sync functionality with a secondary folder. Various options for doing so exist (e.g., a shared intranet folder) and are not discussed at great length here. Those interested in these options can inspect the relevant section in the Program Documentation.

Once relevant data is available, users can press the "Sync" button and then select the desired "Remote" DataTracker folder (Note: this folder must be authorized and named DataTracker as well, if this setting is not relaxed). From this screen, users can choose which files to _send_ to the remote folder and which files to _receive_ from the remote folder. This approach is suggested because it preserves the original structural pattern of the directory and minimizes the chance of human error confusing the program. A visual of this interface, when attempting to sync mock data to a second location, is provided below.

<div align="center" width="100%">
    <img src="/docs/demo_sync_data.png" alt="Visual of sync screen with demo data"/>
</div>
