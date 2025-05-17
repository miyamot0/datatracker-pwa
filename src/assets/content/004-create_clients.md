---
title: Creating and Working with Individual Client Folders
description: This documentation entry provides an overview of the individual client folders within the Data Tracker program, including its purpose, structure, and how to create and delete Individual folders.
date: 09/02/2024
keywords: 'Data Organization'
author: 'Shawn Gilroy'
---

The **Individual** folders, which are nested under respective **Group** folders, are a critical part of the data management strategy and hierarchy. These folders are dedicated to housing _all_ data related to a specific participant or subject within the larger context of a research study or clinical service (e.g., inpatient vs. outpatient care). Each **Individual** folder is named after the participant it represents, typically using a unique identifier such as a participant ID or name, like "Participant_001" or "Subject_A." This structure ensures that all data collected from a particular individual is systematically stored in one location, facilitating easy access and analysis. As a note, you must follow research and clinical data management practices for your institution when naming and storing data; however, DataTracker works only on local data and no information is ever transmitted to the internet.

### Overview of Folder Structure (Nested within Group Folder)

The primary purpose of the **Individual** folder is to maintain the integrity and continuity of data for each participant throughout the process of recording and interpreting data (e.g., research, care). Since coordinating support often involves multiple Evaluations (e.g., assessments over time), the **Individual** folder acts as a centralized repository where all data related to a single participant are aggregated. This organization is particularly beneficial in longitudinal and times-series studies, where tracking changes in behavior or responses over time is central to the approach. By keeping all relevant data within one **Individual** folder, researchers can easily follow the progression of a participant's performance or responses, ensuring that no data is lost or mischaracterized.

For example, consider a study examining the effects of communication training on social interactions in children with autism. Each child participating in the study would have their own **Individual** folder, such as "Participant_001" or "Child_Autism_001." Within this folder, researchers would store all data collected from that child, including baseline assessments, intervention sessions, and follow-up evaluations. This approach allows researchers to track the child's progress over time, compare results across different assessments, and analyze the impact of the intervention on their social skills. By maintaining a clear and consistent structure for **Individual** folders, researchers can ensure that data is well-organized, accessible, and accurately attributed to the correct participant.

The rationale for this structure is to provide a systematic way to organize participant-specific data, ensuring that all information is easily traceable back to the individual it pertains. This not only aids in data analysis but also supports accurate record-keeping, which is vital for the credibility and reproducibility of research findings. Furthermore, this organization helps prevent data from different participants from becoming mixed up, reducing the likelihood of errors in data interpretation or reporting. By implementing a clear and consistent naming convention for **Individual** folders, the program enhances data management practices, making it easier for researchers to handle large datasets and collaborate effectively within research teams.

### Creating and Deleting Individual Folders

To create a new **Individual** folder, you can do so by clicking the "Create Individual" button available within the **Group** folder associated with the study or clinical service. This will prompt a dialog box to appear, asking you to enter a name for the new **Individual** folder. Once you have provided the desired name (e.g., "Participant_001"), the new **Individual** folder will be added to the program's hierarchy. You can then begin populating the **Individual** folder with data files, evaluations, and other relevant information for that participant. A visual of this interface is provided below:

<div align="center" width="100%">
    <img src="/docs/folder_preview_clients.png" alt="Image Individuals Dashboard interface"/>
</div>

If you need to delete an **Individual** folder, you can do so by selecting the relevant option from the dropdown associated with the folder (i.e., the "Delete" option). Clicking this button will trigger a confirmation dialog to ensure that you want to delete the **Individual** folder and all its contents. Once you confirm the deletion, the **Individual** folder and all its subfolders will be permanently removed from the program. Please exercise caution when deleting **Individual** folders, as this action cannot be undone, and all data within the folder will be lost. Recommendations for deletion permissions are similar to those for **Group** folders, as outlined in the previous section. A relevant visual for this is provided below:

<div align="center" width="100%">
    <img src="/docs/folder_preview_clients_delete.png" alt="Image for Client Dashboard interface related to deletion"/>
</div>
