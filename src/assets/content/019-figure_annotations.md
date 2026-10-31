---
title: Annotating Figures with Phase Lines, Aim Lines, and Text
description: This entry explains how to add phase change lines, aim lines, and text annotations to figures. Instructions are provided to support users in using annotations to aid in performing visual analysis.
date: 10/27/2026
keywords: 'Phase Change Lines, Aim Lines, Text Annotations'
author: 'Shawn Gilroy'
index: 19
---

The purpose of this entry is to provide guidance on how to annotate the proportion and rate figures with phase change lines, aim lines, and text. Annotations help a reader interpret a figure without leaving it. For example, a vertical line can mark where an intervention begins, a horizontal aim line can show a target level of responding, and a short label can name the phase or describe an event that caused a change in responding. Both features are designed to make the figure easier to read for others, including people who did not collect the data.

Annotations only change how the figure is drawn. They are stored with the other series styles for an evaluation, and they **do not alter the underlying session data**. You can add, edit, or remove them at any time without affecting any recorded sessions or calculated values.

### Annotation Controls

Both the Rate and Proportion sections of an evaluation each provide annotation controls in the toolbar above the figure and include: **Phase Changes** and **Text**. On narrow screens these show only their icons, so hover over one to see its full name. Clicking either control opens a dialog where *each row* represents *one annotation*.

Aim lines do not have a toolbar control. They are opened from the **Aesthetics** menu, under **Annotations**, then **Aim Lines**. The Annotations submenu also lists **Text Labels** and **Phase Change Lines**, which open the same dialogs as the toolbar controls.

![Image of the Annotations submenu](screenshots/figure_menu_annotations.png 'Image of the Annotations submenu')

Phase change lines are shared annotations that persist across *both* Rate and Proportion figures. Aim lines and text annotations are scoped to a single page, given that each page has a respective Y axis that is not often meaningful across pages. The sections below describe each annotation type in detail.

#### Phase Change Lines

Phase change lines are vertical reference lines that mark a point in the figure, such as where a new phase or condition begins. Each line runs the full height of the plotting area, from the top down to the x-axis. Because lines always span the whole plot, they need only a position and a style (e.g., solid, dashed, or dotted).

Clicking **Phase Changes** opens a dialog where you can add, edit, and delete lines. Each line is shown on its own row with the following fields:

- **Position:** The X-Axis value where the line is drawn. This must be a number greater than 0, but it can have a fractional value (e.g., 6.5 as between session 6 and session 7).
- **Line type:** Options for lines are solid, dashed, or dotted. Lines are always black.
- **Delete:** Removes that annotation/line only. The delete button is always at the far right of the row.

![Image of the phase change lines dialog](screenshots/phase_changes_dialog.png 'Image of the phase change lines dialog')

Adding a new phase change line requires specifying its position and line type. Users can click **Add Line** to create a new row. A row with an invalid position is shown with a message and is not saved until its position is corrected. If you enter a position that is not a number, or zero or less, the line is not saved, so it does not appear in the figure.

**Example:** You have a Baseline phase that runs from session 1 to session 6, and an intervention that begins at session 7. You can add a line at position 6.5 with a solid style, so it falls between the last baseline session and the first intervention session (i.e., a solid line indicating a change in contingency). You may add a second line at a later position if a second change occurred, using a dashed style or alternative to highlight other relevant changes (e.g., change of implementer, rather than change in terms of procedure).

#### Aim Lines

Aim lines are horizontal reference lines that show a target or criterion level, such as a goal rate or a level of responding that the intervention is expected to reach. Each line is drawn from an X1 value to an X2 value at a constant Y value. Unlike phase change lines, aim lines are not limited to the full height of the plot, so they can cover only the sessions that matter (e.g., only the intervention phase).

Aim lines are opened from **Aesthetics**, then **Annotations**, then **Aim Lines**. Each line is shown on its own row with the following fields:

- **X1:** The X-Axis value where the line starts. This must be a number.
- **X2:** The X-Axis value where the line ends. This must be a number. Enter a value greater than X1 so the line runs from left to right.
- **Y:** The Y-Axis value of the line. This must be a number, and it uses the units of the figure's vertical axis (percentage on the proportion page, rate units on the rate page).
- **Line:** Options are solid, dashed, or dotted. Dashed is the default for a new line.
- **Color:** A color from the series palette, so an aim line can be distinguished from the data and from other aim lines.
- **Delete:** Removes that aim line only. The delete button is shown at the end of the row.

![Image of the aim lines dialog](screenshots/aim_lines_dialog.png 'Image of the aim lines dialog')

Users can click **Add Aim Line** to create a new row. A row with a missing or non-numeric X1, X2, or Y value is shown with a message and is not saved until it is corrected. Aim lines are scoped to the page they are added on. The Rate and Proportion pages each keep their own list, and an aim line added on one page does not appear on the other.

**Example:** On the rate page, a therapist sets a goal of 4 responses per minute for the final phase. They add an aim line with X1 set to the first session of the intervention, X2 set to the last session, Y set to 4, Line set to dashed, and a color that stands out from the data series. The line then shows the goal across only the intervention sessions.

#### Text Annotations

Text annotations place a label at a specific point in the figure, such as a note describing a phase or an event. Users may click the **Text** control to open a dialog where you can add, edit, and delete text annotations. Each entry is shown on its own row, and the fields are arranged in pairs so that related settings sit side by side. Each entry includes the following fields:

- **Label:** The text to draw. To break the text across lines, type the literal sequence `\n` where the new line should begin. For example, `Baseline\nWeek 1` is drawn on two lines, which is often needed when phases are short and the width is narrow. A label is required before the entry is saved or drawn.
- **Weight:** Normal or Bold. Normal is the default. Choose Bold for a label that should stand out from the data or from other notes (e.g., Phase Name vs. descriptive note).
- **X:** The X-Axis value of the anchor point. This must be a number.
- **Y:** The Y-Axis value of the anchor point. This must be a number. Rate and proportion figures use different y-axis units, which is why text is scoped to a page. On the proportion page, Y is expressed on a 0 to 100 scale. On the rate page, Y is in the rate units shown on that figure's axis.
- **Anchor:** The point of the text box that sits at the X and Y position. The options are the nine positions from top-left to bottom-right, including center. The default is middle-left, which places the vertical middle of the text at the point with the text extending to the right. For example, top-left places the top-left corner of the text at the point.
- **Justify:** How lines are aligned inside the text box: left, center, or right. This matters only when the label has more than one line (e.g., centered vs. left-aligned).
- **Delete:** Removes that text annotation.

![Image of the text annotations dialog](screenshots/text_annotations_dialog.png 'Image of the text annotations dialog')

Users can add new annotations by clicking **Add Text** to create a new row. A row missing a label or a numeric X or Y is shown with a message and is not saved until it is corrected. An entry whose position falls outside the plotted area is not drawn.

**Example:** On the rate page, users may wish to provide (in addition to Baseline and Intervention labels), a note that marks a change or modification to a procedure. For example, users could choose to add the label `Caregiver implemented`, set X to the relevant session number, and set Y to a value slightly above the point where the note would sit beside. Setting the anchor to bottom-center with text centered would place the bottom of the text near the specified point and center it horizontally for clarity.

#### Text Size and Annotation Layout

Annotation text is drawn at the figure's text size, which you choose in the figure's text size option. The **Base**, **Large**, and **Extra Large** sizes increase the height of every label, so a multi-line label takes more vertical room at larger sizes. When you increase the text size, check that a label placed near the top or bottom of the plot still fits within the figure. Adjust its Y value or anchor if it crowds the title, the x-axis label, or another annotation.

Text size affects only how annotation text is drawn. It does not change the position an annotation is anchored to.

### Saving, Reset, and Persistence

Phase change lines, aim lines, and text annotations are saved with the other series styles for the evaluation, and they persist in the same way as those styles. They are kept on the local machine, so they remain when you return to the evaluation, and they carry over as more data and conditions are added to the data set.

Clicking **Reset All to Defaults** in the **Styles** dialog does not remove phase change lines or text annotations. It does remove aim lines, because that reset clears the aim line list along with the series and condition styles. To remove other annotations, delete them in their own respective dialogs.

### Closing Notes and Tips

Annotations are most effective when they are sparse and purposeful. A few well-placed lines and labels help a reader follow the phases, while many overlapping labels can make the figure harder to read. Use Bold for the one or two notes that matter most, and reserve Normal for supporting detail.

When a figure is prepared for a report or presentation, review it at the text size you plan to use. Confirm that each label sits where you intend and that no note crowds another. Because annotations are stored separately from the data, you can refine them at any time without re-recording or re-calculating anything.
