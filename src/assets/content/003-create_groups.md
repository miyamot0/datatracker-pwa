---
title: Creating and Working with Group Folders
description: This documentation entry provides an overview of the Group folder within the Data Tracker program, including its purpose, structure, and how to create and delete Group folders.
date: 09/01/2024
keywords: 'Data Organization'
author: 'Shawn Gilroy'
---

The **Group** folder is the largest element in the organizational hierarchy of the Data Tracker program. For these categories/groups, these are likely to function as the primary container for data collected in a specific study, a research project, or as a part of clinical service (e.g., inpatient vs. outpatient). The goal of this distinction is to encapsulate context and make it easier to find and manage data files outside the program (if necessary, _not recommended_). The following is a description of the different levels of the file hierarchy and what they represent.

### Overview of Folder Structure

Within the **Group** folder, data will be organized into subfolders representing individual participants or subjects. The **Group** folder itself sets the stage for the entire organizational structure and allows the program to form associations between recorded data. It is critical to thoughtfully name and maintain these **Group** folders because they act as an umbrella under which all individual-level data will be aggregated and organized. This organization prevents data from different studies from accidentally mixed up or exposed, which is important in research environments where multiple studies might be conducted simultaneously. By keeping each study's data compartmentalized within its own **Group** folder, researchers can avoid confusion and ensure that all analyses and reports are based on the correct datasets.

For example, imagine a research lab conducting several studies simultaneously, such as multiple novel extensions of an existing procedure. In this case, you would create two distinct **Group** folders, named "Study Name A" and "Study Name B." Each folder would contain all relevant data for its respective study, including participant data, evaluation results, and specific experimental conditions. This clear separation allows researchers to focus on each study individually, ensuring that data integrity is maintained. Moreover, if a researcher needs to revisit the "Study Name A" study for further analysis or publication, they can quickly locate all related data within its dedicated **Group** folder. This system not only enhances efficiency but also supports accurate data management practices, which are critical for the credibility and reproducibility of research findings.

The rationale behind this structured approach is to promote a systematic, error-free method of data organization that scales well with the complexity and size of research projects. By organizing data within well-defined **Group** folders, the program helps researchers manage vast amounts of information in a way that is both logical and accessible. This structure minimizes the risk of data mismanagement, facilitates collaboration among research teams, and supports the long-term storage and retrieval of research data, which is essential for ongoing and future studies.

### Creating and Deleting Groups

To create a new **Group** folder, you can do so by clicking the "Create" button available in the initial dashboard screen. This will make a dialog box will appear, prompting you to enter a name for the new **Group** folder. Once you have entered the desired name, click to confirm and the new **Group** folder will be added to the program's hierarchy. You can then begin populating the **Group** folder with subfolders for individual clients as needed. A visual of this interface is provided below:

<div align="center" width="100%">
    <img src="docs/folder_preview_groups.png" alt="Image Group Dashboard interface"/>
</div>

If you need to delete a **Group** folder, you can do so by selecting the relevant folder(s) using the checkboxes for respective rows. Note: The checkboxes for deleting **Group** folders are located in the leftmost column of the table and are only available when deletion is enabled in program settings. Whenever a **Group** folder is selected, a "Delete" button will appear at the top of the dashboard, highlighted in red. You can click this button to initiate the deletion process. Pressing this button with cause a confirmation dialog will appear to ensure that you want to delete the **Group** folder and all its contents. Once you confirm the deletion, the **Group** folder and all its subfolders will be permanently removed from the program. Please exercise caution when deleting **Group** folders, as this action cannot be undone, and all data within the folder will be lost.

As a base default, users are not authorized to delete any information. This may be enabled, as necessary, by selecting the relevant option in the _Settings_ page. It is generally recommended to restrict deletion permissions to prevent accidental data loss and maintain data integrity. A relevant visual for this is provided below:

<div align="center" width="100%">
    <img src="docs/folder_preview_groups_delete.png" alt="Image for Group Dashboard interface related to deletion"/>
</div>
