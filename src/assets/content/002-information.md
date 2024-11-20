---
title: Organizational Structure and Design
date: 08/31/2024
keywords: 'Program Use, Data Organization'
author: 'Shawn Gilroy'
---

The DataTracker program is designed to provide considerable flexibility in how data are collected and managed. This flexibility allows you to structure your data in a way that makes sense for your specific needs and research questions. However, there are several critical and recommended organizational practices to adopt to ensure that your data are easily accessible and manageable.

This document provides an overview of the recommended organizational structure for data within the DataTracker program. It also outlines several conventions to follow when using the program.

### DataTracker Folder Access

DataTracker is a website at its core. It does not have access to your hard drive as an installable program would. This is a security feature of web browsers that is designed to protect your data. Fortunately, at the users discretion, you may authorize _very specific_ access to your hard drive when working with websites. This is a common feature of many web-based programs that need to save data locally on your machine.

Because of how this program is designed, you will be prompted to approve the program access to **a specific** folder on your hard drive whenever you use it. This must happen once **every time** you use the program. This is a critical aspect of web security that is common across all browsers.

The DataTracker interface will provide cues to indicate if the required access has, or has not, been authorized. A pair of images visualizing each status are shown below:

<div align="middle" width="100%">
    <img src="/docs/access_not_authorized.png" alt="Image of access not being authorized" />
    <img src="/docs/access_authorized.png" alt="Image of access being authorized" />
</div>

### Approving the 'DataTracker' Folder

The DataTracker program will present a prompt to the user if access has not been granted to a primary 'DataTracker' folder. Specifically, upon clicking the 'Load Application' button, the program will present a page prompting the user to authorize the relevant folder. A visual of this is shown below:

<div align="center" width="100%">
    <img src="/docs/authorize_folder_access.png" alt="Image of DataTracker program access screen"/>
</div>

Pressing the 'Authorize Access' button will prompt you to use a Folder named DataTracker (i.e., "DataTracker" folder in your _Documents_ folder or on your _Desktop_). This is largely as a strategy to avoid accidentally loading a "Group" folder as if it were a "DataTracker" folder. This can be disabled, but for good practice, it is kept as a default setting. Using **Google Chrome** in Windows, this could appear as the following:

<div align="center" width="100%">
    <img src="/docs/approve_folder.png" alt="Image of relevant 'DataTracker' folder being selected"/>
</div>

### Some General Rules for Working with DataTracker Data

The DataTracker program is powerful, and can greatly simplify data collection, but several guidelines are suggested to maximize reliability and prevent data loss. For example, the DataTracker program disables the deletion of data to prevent accidental and unrecoverable loss of information; however, this can be temporarily authorized in Settings to assist with correctly removing specific data. Similarly, as a working default, it makes the most sense to work from a "DataTracker" folder in your _Documents_ directory on your own machine. This can be disabled for added flexibility, however, it is kept as a default setting for good practice to avoid improper operation.

Several additional rules that are good to follow when working with the DataTracker program are reviewed in the headings below.

#### Hand-editing Data Files: <ins>Not a Good Idea</ins>

The program saves files in JSON format (Javascript Object Notation), which is a universal data format that can be read by many different programs. It can be read from software such as browsers, statistical software, programming languages, etc. It's used virtually everywhere and by almost everything.

If you attempt to edit this file by hand, without knowing the implications of what you are changing (e.g., type and content of fields), you can create problems when attempting to read data in the future. For this reason, it is recommended to _not_ edit these files by hand unless you are positive that you understand the implications of these changes.

If you need to _delete files or folders_, it is advised to use the built-in interface to do so.

#### Moving Folders Around in the DataTracker Folder: <ins>Probably Not a Good Idea</ins>

Certain manual operations in the DataTracker program are less impactful than others. For example, adding a folder in an "Evaluation" directory would add a new "Condition" without requiring direct interactions with the program. Likewise, adding a folder in the "Client" directory would similarly add a new individual with the associated folder name. Although these operations have the potential to simplify certain operations, copy/pasting folders in bulk is likely to be problematic.

Various aspects of the program will attempt to 'remember' certain selections, and if previously referenced files/folders are not accessible, this can introduce unpredictable errors. This is because the program will _expect_ certain folders to be in certain locations. This is especially relevant for the **Session Builder**, since it will attempt to _remember_ recent sessions and conditions that may no longer exist if you have edited/deleted those folder.

If you make major changes to the folder structure, this can introduce significant risks of program error.

#### Copying a KeySet (\*\*.json File): <ins>Probably Okay</ins>

It is often the case that a common set of targets is shared across Participants in a study. In this case, it is likely that you will want to copy a KeySet file from one case to another. This is generally okay, but it is important to remember that the Keyboard file _must be in the correct location_. If you copy a KeySet file to the wrong location, it will (1) not be accessible in the **Keyboard Designer** or **Session Designer** and (2) could cause the program to crash if the program reads it thinking it is a data file (e.g., when calculating Reliability or summarizing rates).

Although it is possible to copy/paste KeySet files to save time (if you understand how the program is designed to work), it is generally recommended to use the built-in KeySet import functionality or to sync the individual's folder from a more current remote directory (i.e., files on a shared drive).

#### Creating Evaluation Conditions by Hand: <ins>Probably Okay</ins>

It is likely that certain types of conditions will be used across Participants for a given **Evaluation**. For example, a "Baseline" condition is likely to be used for all Participants in a study. In this case, it is likely that you will want to create a "Baseline" folder by hand for each of the Participants. This is generally okay, but it is important to remember that the **Condition** folder _must be in the correct location_ and _must be empty_.

#### Copying Reliability Files: <ins>Probably Okay</ins>

As a working default, files for the Reliability data collector will need to be moved to a central location for analysis. This is expected behavior, though it is important to remember that the Reliability file _must be in the correct location_ (i.e., correct **Evaluation** and **Condition**). Users can copy/paste these files; however, it is recommended to use the built-in sync functionality to ensure that files are migrated properly.

### Structure and Hierarchy of Data Tracker Information

The program infers data file structure based on _how its named_ and _where it is stored_. For this reason, it is important not to unintentionally move files into locations that may prompt confusion. A simple outline of the basic 'DataTracker' folder structure is illustrated below.

- _Group_ Folder (e.g., clinic, study grouping, etc.)

  - _Individual_ Folder (e.g., client name or identifier)

    - '[_KeySet Name Here_].json' File (a file associated with keys/behavior codes)

    - _Evaluation_ Folder (e.g., functional analysis, treatment evaluation)

      - 'settings.json' File (a file for remembering on-going session designs)

      - _Condition_ Folder (e.g., baseline, treatment, etc.)

        - Session Data File, e.g. '[Session Number]\_[Condition Name]\_[Primary/Reliability].json' (File recording session performances)

### Descriptions for Each Level of File Hierarchy

Individual data files and folders are organized semantically on your hard drive. This means that the structure of the data files on your hard drive should reflect the structure of the data in the program. This is done to make it easier to find and manage data files outside of the program. The following sections provide a description of the different levels of the file hierarchy and what they each represent.

#### Group-Level Folder (Grouping by Clinic, Study, etc.)

The highest organizational level is the **Group** folder, which serves as a container for all data related to a specific study, clinical group, or research project. Each **Group** folder can be named however you wish, though it is recommended to be short and easily discriminated. For example, a **Group** folder might be labeled "Novel Preference Study 2024" as a means of grouping individual that are specific to this study in this area on your hard drive.

#### Individual-Level Folder (Grouping by Individuals)

Within each Group folder, there are **Individual** folders that each representing a unique participant or subject. These folders are named after the individual they pertain to, often using a participant ID or name, such as "Participant_001" or "Subject_A." These folders contain all data collected for that specific individual throughout the study, which are further delineated in terms of specific procedures. For the sake of data organization and clarity, it is recommended to have one **Individual** folder for a client and various "Evaluation" folders for various procedures (e.g., preference assessment, functional analysis).

#### Evaluation-Level Folder (Grouping by Purpose of Data)

Nested within each Individual folder are various **Evaluation** folders. Each Evaluation folder corresponds to a distinct procedure (e.g., functional analysis). For example, data for one individual may emerge from a preference assessment in one **Evaluation** folder and a "treatment evaluation" in another. These folders are labeled according to the procedure or assessment they contain, such as "Functional Analysis" or "Treatment Evaluation." This level organizes the data collected from each session so that data can be meaningfully visualized and summarized.

#### Condition-Level Folder (Grouping by condition; e.g., baseline, treatment, etc.)

At the most granular folder level is the **Condition** folder. Each **Condition** folder represents a specific condition, task, or experimental setup under which the individual's behavior was recorded during the "Evaluation". For example, a **Condition** folder might be named "Baseline" or "Intervention" to distinguish between data collected in varying contexts within a specific evaluation (e.g., conditions of functional analysis). Grouping data by this way assists with summarizing and visualizing behavior as a function of specific environmental conditions.
