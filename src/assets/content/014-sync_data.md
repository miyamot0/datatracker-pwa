---
title: Syncing Data to Shared a Location(s)
description: This documentation entry provides an overview of the process of syncing data to shared locations in DataTracker and steps to sync data across multiple devices.
date: 11/11/2024
keywords: 'Data Organization, Data Synchronization'
author: 'Shawn Gilroy'
---

The DataTracker program, by design, focuses on the collection and management of behavioral data on a single machine. Although this is typically the case for many research and clinical settings, there are instances where data needs to be shared across multiple devices or platforms. In such cases, it is required to have some method of syncing data to shared locations to ensure that all users have access to the most up-to-date information.

The DataTracker program is designed to be flexible and adaptable to different data management needs. Specifically, it provides several options for syncing data to shared locations to (A) support collaboration with other data collectors (e.g., data related to reliability) and (B) provide a means of regularly backing up research data. There are currently two approaches for doing so, which are each outlined below.

### Option 1: Assisted Migration and Syncing (Recommended)

The first option for syncing data to shared locations is to use the **Assisted Migration and Syncing** feature. This feature is designed to help users move data from one location to another and keep it in sync across multiple devices. In execution, this means that the user will **select another folder location** (e.g., a shared network drive, cloud storage, etc.) and the program will assist the user in moving the necessary data to that location. This can be done on a regular basis to ensure that all users have access to the most up-to-date information.

#### Accessing Sync Functionality

The option for syncing files is provided in the header of the program. This option cannot be accessed until the user has provided access to their main directory, and if access is not yet authorized, it will be 'greyed out' and cannot be selected. An illustration of this is provided below.

<div align="center" width="100%">
    <img src="/docs/sync_unauthorized.png" alt="Visual of unauthorized sync option"/>
</div>

The option to sync files will be available once the user has provided access to their main directory. This is generally available once the program has been authorized to access to files in question. An illustration of this is provided below.

<div align="center" width="100%">
    <img src="/docs/sync_authorized.png" alt="Visual of authorized sync option"/>
</div>

#### Navigating the File Sync Interface

The screen for syncing files provides a button for authorizing the Remote Backup location. Like the core DataTracker folder, this involves selecting and authorizing a location that the program can access. Once authorized, the program compare files across _both_ locations and provide a list of files that can copied to the selected location. A visual of this interface is provided below.

<div align="center" width="100%">
    <img src="/docs/sync_screen_folder_auth.png" alt="Visual of sync screen with button auth"/>
</div>

Upon providing access to the Remote Backup location, the program will provide a list of files that can be moved to the selected location. The user can then indicate which files should be moved and which should be left in place. As a general default, files copied to the Remote Backup location are removed from the current page but are not deleted from the main DataTracker folder. An illustration of the interface for moving data FROM the the main (i.e., 'Local') location to the secondary (i.e., 'Remote') location is provided below.

<div align="center" width="100%">
    <img src="/docs/sync_screen_folders_list.png" alt="Visual of sync screen TO remote"/>
</div>

Alternatively, the user can move files from the Remote Backup location to the main DataTracker folder. This is done by selecting the files to be moved and clicking the 'Move to Local' button. This is often useful when preparing a machine for a Reliability data collector (e.g., pulling KeySets to a new machine). An illustration of this interface is provided below.

<div align="center" width="100%">
    <img src="/docs/sync_screen_folders_list_from.png" alt="Visual of sync screen FROM remote"/>
</div>

This is the recommended approach for syncing data to shared locations, as it provides a straightforward and user-friendly way to keep data in sync across multiple devices.

### Option 2: Manual Copying of Folders/Files (Advanced)

The second option for syncing data to shared locations is to manually copy the necessary folders and files to the desired location. This approach is more advanced in the sense that the user must have a good understanding of the program's file structure and how/where data should be stored.

In general, this approach is not recommended for most users, as it can be error-prone and may result in data loss if not done correctly. However, for users who are comfortable with managing files and folders, this approach would be the most efficient way to sync and backup data across multiple locations.
