---
title: Syncing Data to Shared Location(s)
description: This documentation entry provides an overview of the process of syncing data to shared locations in DataTracker and steps to sync data across multiple devices.
date: 11/11/2024
keywords: 'Data Organization, Data Synchronization'
author: 'Shawn Gilroy'
---

The DataTracker program, by design, focuses on the collection and management of behavioral data on a single machine. Although this is typically the case for many research and clinical settings, there are instances where data needs to be shared across multiple devices or platforms. In such cases, it is required to have some method of syncing data to shared locations to ensure that all users have access to the most up-to-date information.

The DataTracker program is designed to be flexible and adaptable to different data management needs. Specifically, it provides several options for syncing data to shared locations to (A) support collaboration with other data collectors (e.g., data related to reliability) and (B) provide a means of regularly backing up research data. There are currently two approaches for doing so, which are each outlined below.

### Option 1: Assisted Migration and Syncing (Recommended)

The first option for syncing data to shared locations is to use the **Assisted Migration and Syncing** feature. This feature is designed to help users move data from one location to another and keep it in sync across multiple devices. In execution, this means that the user will **select another folder location** (e.g., a shared network drive, cloud storage, etc.) and the program will assist the user in moving the necessary data to that location.

This can be done on a fairly regular basis to ensure that all users have access to the most up-to-date information. As a general guideline, it is probably useful to pull remote data to the local machine at the start of the day to ensure that all data collectors are working with the most recent data (e.g., new **Conditions** or **KeySets** created). Similarly, it is useful to push data to the remote location at the end of the day to ensure that all data is backed up and available for future use.

#### Accessing Sync Functionality

The option for syncing files is provided in the header of the program. This option cannot be accessed until the user has provided access to their main directory, and if access is not yet authorized, it will be 'greyed out' and cannot be selected. An illustration of this is provided below.

<div align="center" width="100%">
    <img src="/docs/sync_unauthorized.png" alt="Visual of unauthorized sync option"/>
</div>

The option to sync files will be available once the user has provided access to their main directory. This is generally available once the program has been authorized to access to files in question. An illustration of this is provided below.

<div align="center" width="100%">
    <img src="/docs/sync_authorized.png" alt="Visual of authorized sync option"/>
</div>

Once clicked, the "Sync" button will direct the user to the File Sync Interface that supports the migration and syncing of files to a secondary location.

#### Navigating the File Sync Interface

The File Sync Interface provides a method for selecting a Remote Backup location and maintaining parity with that location (i.e., presence of similarly-named files). Like methods for authorizing core DataTracker folder (Local), this involves selecting and authorizing a separate location that the program can also access (Remote). Once each are authorized, the program compares files across _both_ locations and provides a list of files that can copied to the selected location. A visual of this interface, prior to authorizing the Remote location, is provided below.

<div align="center" width="100%">
    <img src="/docs/sync_screen_folder_auth.png" alt="Visual of sync screen with button auth"/>
</div>

##### Moving File to the Remote Backup Location

Upon providing access to the Remote Backup location, the program will provide a list of files that can be moved from the Local to the Remote location. Users can indicate which files should be moved and which should be left in place. As a general default, files copied to the Remote location are removed from the current page but are not deleted from the main DataTracker folder. An illustration of the interface for moving data _from_ the main location (Local) to the secondary (Remote) location is provided below.

<div align="center" width="100%">
    <img src="/docs/sync_screen_folders_list.png" alt="Visual of sync screen TO remote"/>
</div>

Individual files can be selected for sync via the checkboxes provided and then synced by using the respective button for beginning the sync process.

##### Moving File from the Remote Backup Location

Alternatively, users can move files from the Remote location to the main DataTracker folder (Local). This is not the initial state for the File Sync Interface, but can be accessed by clicking the "FROM Remote" button at the top of the interface. This will change the interface to show files that are available in the Remote location and can be moved to the Local location. An illustration of this interface is provided below.

<div align="center" width="100%">
    <img src="/docs/sync_screen_folders_list_from.png" alt="Visual of sync screen FROM remote"/>
</div>

### Option 2: Manual Copying of Folders/Files (Advanced)

Option #1 is the recommended approach for syncing data to shared locations, as it provides a straightforward and user-friendly way to keep data in sync across multiple devices. However, there are instances where a more flexible strategy is required, such as when users need to manage data in a more granular way or when they want to sync data to locations that are not supported by the Assisted Migration and Syncing feature. Option #2 is a manual approach that allows users to copy files and folders directly to a shared location, such as a network drive or cloud storage. This approach is more advanced in the sense that the user must have a good understanding of the program's file structure and how/where data should be stored.

In general, this approach is not recommended for most users, as it can be error-prone and may result in data loss or unexpected program behavior if not done correctly. However, for users who are comfortable managing files and folders, this approach would be the most efficient way to sync and backup data across multiple locations. Generally speaking, this is largely a copy-and-paste operation, where users can copy files from the main DataTracker folder to a shared location (e.g., network drive, cloud storage, etc.) and vice versa.
