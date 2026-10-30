---
title: Saving, Loading, and Deleting Style Files
description: This entry explains how to write, read, and delete the styles.json file for an evaluation from the figure menu bar. It also describes what the file contains, how Undo works when reading a file, and how the file is handled by the File Sync Assistant.
date: 10/28/2026
keywords: 'styles.json, Saving Styles, Loading Styles, Deleting Styles'
author: 'Shawn Gilroy'
index: 21
---

The purpose of this entry is to explain how to save your figure styling to a file, reload it later, and remove it. A style file lets you carry the look of a set of figures (series styles, titles, legend settings, phase lines, aim lines, and text annotations) between sessions or between computers, without re-creating each setting by hand. As with the other figure settings, these actions only change how figures are drawn.

### Where Styles Are Stored

The style file is named `styles.json` and is stored in the individual-specific evaluation folder, beside the `settings.json` file for that evaluation. Its location follows the usual pattern of group, individual, and evaluation folders. The file name is reserved, so KeySets cannot be named `styles` or `styles.json`.

The file holds the settings that are otherwise kept in the browser for each evaluation, including:

- Series styles for keys and conditions, such as marker shapes, marker fills, line colors, and hidden series.
- Titles, axis labels, and whether the title is hidden.
- Maximum tick overrides for the X axis, and for the Y axis on Rate figures.
- Font family, either Default or Times New Roman.
- Legend position, layout, and whether conditions appear in the legend.
- Phase change lines, aim lines, and text annotations.
- Display options such as tooltips, descriptions, and connected spans.

### Writing a Style File

Open the figure menu bar on a Rate or Proportion page, click **File**, then choose **Style Information**, then **Write styles.json**. The program saves the current styles for the evaluation to `styles.json`, replacing any existing file in that folder. A confirmation message reports that the file was saved. If the file cannot be written, an error message is shown and the existing file is left as it was.

### Reading a Style File

To apply a saved style file, click **File**, then **Style Information**, then **Read styles.json**. The program reads the file, checks that it is valid, and applies the settings to the current evaluation. The figure updates immediately.

Before applying the file, the program keeps a copy of the styles that were in use. A confirmation message then shows an **Undo** action. Selecting **Undo** restores the styles from before the read. This copy is kept only for the current browser tab, so **Undo** is not available after you close the tab or reload the page. Reading a file does not change the file itself.

If the evaluation folder does not contain a `styles.json`, the program shows a message saying so and makes no changes. If the file exists but is not valid, an error message explains the problem and the current styles are not changed. Partial files are accepted: any setting missing from the file keeps its current value.

### Deleting a Style File

To remove the file from the evaluation folder, click **File**, then **Style Information**, then **Delete styles.json**. The program asks you to confirm before deleting. Deleting the file **cannot be undone**. Deleting the file does not reset the styles that are currently shown on the page. If no file exists, the program reports that there was nothing to delete.

### Syncing Style Files

The **File Sync Assistant** on the sync page lists `styles.json` as its own file type, labeled **Figure Styles**, so it can be distinguished from session data and settings. Each table shows this in its **Type** column, which is visible by default. Like other files, it can be synced to a remote backup directory or from one. Because a synced file replaces the one at the destination, syncing from a remote folder will overwrite the styles stored on the current machine for that evaluation. Review the sync table before you sync styles between machines.

To sync only styles, open the **Type** filter above either sync table and choose **Figure Styles**. The table then shows only `styles.json` files, so you can select and sync them without other session data. Choose **All types** to return to the full list.

### Closing Notes and Tips

A few tips are provided here to help with visualizing outcomes consistently across users and machines. First, write a style file after you finish styling a set of figures, so you have a copy you can save/restore/share. Second, sync that file to a remote backup or another machine to keep the styles consistent across environments. Third, on new machines, pull the relevant information for a case to your new *local* machine, including the relevant figure styles. Lastly, you can use **Read** styles on the new machine to ensure that the same look is applied to the evaluation figures.
