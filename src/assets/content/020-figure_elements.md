---
title: Customizing the Legend, Titles, and Axis Labels
description: This entry explains how to change where the legend is drawn, whether condition entries appear in it, and how to override, hide, or restore the figure title and axis labels. Instructions are provided to help users prepare figures that are clear to other readers.
date: 10/28/2026
keywords: 'Legend, Figure Titles, Axis Labels'
author: 'Shawn Gilroy'
index: 20
---

The purpose of this entry is to provide guidance on how to customize the parts of a figure that explain information to users. This includes the legend, the title, and the X-Axis and Y-Axis labels. Each of these elements can be updated in the site and changes to these settings only change how the figure is labeled and laid out, there are no changes made to the underlying session data. Note: Each setting is applied specific to Rate or Proportion data (i.e., different Y-Axis represented) and Rate and Proportion figures each have their own default title and axis labels. As such, a change made on one figure does not change the other.

### Figure Editor Controls

The visualization page features a menu bar with a range of various controls that support adjusting the figure displayed. Figure element settings are found in the **Aesthetics** menu of the figure toolbar. These include the following settings:

- **Title**: Opens the dialog for showing/hiding and overriding the figure title.
- **Axes**: A submenu with **Axis Labels** (overriding the X-Axis and Y-Axis labels) and **Axis Limits** (overriding the maximum tick on each axis).
- **Legend**: Opens the dialog for the legend and relevant display settings.

Each dialog will apply changes as you make them, so the figure updates while the dialog is open. Click **Done** to close a dialog and review the changes.

#### Legend

The legend identifies each series and, when enabled, each condition in the figure. The **Legend** dialog includes the following fields to assist with informing the end user:

- **Position:** Represents where the legend is drawn. **Below Figure** places the legend beneath the plotting area. The other options place the legend inside the plotting area, in one of six locations: **Upper Right**, **Lower Right**, **Upper Left**, **Lower Left**, **Middle Left**, or **Middle Right**. Inside positions can cover part of the data, so check the figure after changing this setting.
- **Layout:** The **Horizontal** setting runs the legend entries across and **Vertical** stacks them one under another. Vertical is often easier to read when the legend is placed beside the plot, while Horizontal suits a legend placed below the figure.
- **Conditions in Legend:** This setting refers to whether condition entries are included in the legend along with the series entries. Uncheck this box to show only the series entries (e.g., if Text Annotations already convey this information).

Various settings are available and users can click **Reset to Defaults** to return Position to **Below Figure** and Layout to **Horizontal**. This button does not change the **Conditions in Legend** checkbox.

#### Title

The **Title** dialog controls the figure title. It includes the following fields:

- **Hide Title:** When checked, the figure title is not drawn. Hiding the title is useful when the report or presentation already has a caption that describes the figure. Hide Title applies only to the title, so the axis labels remain in the figure.
- **Override Title:** Users may select this option to use custom text for the title. When it is off, the default title is used and the text box entry is disabled.
- **Title Text:** The text to show when the override is on. The text box is disabled until the override is turned on.
- **Default:** The default title for this page is shown below the text box.

Users may click **Reset to Defaults** to turn off the title override and clear its text. This button does not change the **Hide Title** checkbox. If the title is hidden and you want it back, uncheck **Hide Title** directly.

#### Axis Labels

The **Axis Labels** dialog controls the **X-Axis** and **Y-Axis** labels. Each axis has the following fields:

- **Override:** Users may select this option to use custom text for the axis label. When it is off, the default text is used and text box entry is disabled.
- **Text:** The text to show when the override is on. The text box is disabled until the override is turned on.
- **Default:** The default label for the axis on this page is shown below each text box. For example, the rate page's X-Axis label defaults to **Session**, and its Y-Axis label defaults to **Responses per Min**.

Users may click **Reset to Defaults** to turn off both axis label overrides and clear their text.

#### Axis Limits

The **Axis Limits** dialog lets users set the maximum tick on an axis. The data still determines the minimum. Each axis has the following fields:

- **Override Max:** Users may select this option to set the maximum tick themselves. When it is off, the maximum is taken from the data.
- **Max:** A whole number above zero. The input is disabled until the override is turned on.

The **Y-Axis Max** option is available for the rate figure. The proportion figure's Y-Axis always runs from 0 to 100. Users may click **Reset to Defaults** to turn off both overrides.

### Exporting Figures

Once the legend, title, and labels are set, the figure can be saved from the **File** menu. To keep these settings for later or for another machine, write them to a style file as described in [Saving, Loading, and Deleting Style Files](/documentation/021-styles_file). Click **File**, then **Figure Output**, and choose one of the two formats:

- **Save to SVG:** Saves the figure as a vector image. Lines, text, and the legend stay sharp at any size, so SVG is the better choice for a figure that will be resized, edited in a drawing program, or printed at a large size.
- **Save to PNG:** Saves the figure as a raster image at twice its on-screen size, on a white background. PNG is the better choice for pasting into a document or presentation where a single bitmap is expected.

Both formats save the figure as it appears on the page at that moment, including the title or its absence, the legend position and layout, the axis labels, and all phase change lines, aim lines, and text annotations. Changes made after exporting are not applied to the saved file, so export again after any edit.

The file is named after the page: `rate.svg` or `rate.png` on the rate page, and `proportion.svg` or `proportion.png` on the proportion page. Rename the file after saving if you need to keep several versions of the same figure, because a later export uses the same name.
