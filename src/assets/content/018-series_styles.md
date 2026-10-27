---
title: Customizing Figure Styles
description: This entry reviews how to override marker shapes, marker fills, and line colors as well as how to hide series in figures. Information is provided regarding how these settings are adjusted and persisted over time in figures.
date: 10/26/2026
keywords: 'Series Styles, Marker Shapes, Hiding Data'
author: 'Shawn Gilroy'
index: 18
---

The purpose of this entry is to provide guidance on how to customize series styles in the proportion and rate figures, including marker shapes, marker fills, line colors, and hidden series. It is often the case that certain series may not always be critical to visualize (e.g., subsumed under a broader response class) and certain responses may not be equally relevant across all phases (e.g., alternative responses not yet introduced in baseline conditions). The program provides limited options for accommodating these situations, primarily through hiding series and overriding default styles.

Figures provided in the proportion/rate visuals automatically assign default marker shapes, marker fills, and line colors to each condition and key. These defaults are designed to make the figures readable without additional customization, but you can override them as needed to highlight specific series or hide less relevant ones. Users are free to replace any of these defaults so that the figure is easier to read.

### Style Controls in Rate/Proportion Visuals

The Rate and Proportion sections of an evaluation provide access to several ways to adjust a visualization. Each of these are available through the toolbar at the top of the figure. The **Keys** control shows or hides individual keys, the **Conditions** control shows or hides whole conditions, the **Styles** control opens the styling dialog, and the **Phase Changes** and **Text** controls add annotations, which are covered in [Adding Phase Lines and Text Annotations to Figures](/documentation/019-figure_annotations).

Regardless of the control you use, changes only affect the visual representation of the figure and **do not alter the underlying session data**. Additional information on the style controls is provided in the sections below.

#### Showing and Hiding Keys

The **Keys** control allows you to choose which keys appear in the figure. Each key has a checkbox. You can uncheck a key to remove it from the chart and check it again to bring it back. As a reminder, keys labeled **(Derived)** are "keys" that are calculated from other keys rather than logged manually. The logic builder provided in the KeySet portion of the app can be used to create event types based on other manually logged keys, which then appears in this list like any other key.

**Example:** You are reviewing changes in rates from Baseline to Intervention using a "Combined Target Behavior" class to reflect several related behaviors and wish to inspect when individual sub-targets of the classes change in similar ways. You can do this by opening **Keys** and selectively checking or unchecking the sub-targets you want to focus on or explore.

As a reminder, keys that are flagged as 'hidden' will not appear in the figure nor in the styling dialog for individual series.

#### Styling: Condition-wide Settings

It is often the case that you want all series within a condition to share a common visual style, such as a common marker fill color (e.g., all markers in Baseline have black fill, all markers in Intervention have white fill). This helps quickly distinguish one condition from another in the figure. The program provides some simple defaults, but you may wish to override them to match your preferred color scheme or to emphasize certain conditions.

Clicking the **Styles** control presents a dialog with various options for customizing the appearance of series in the figure. The top-most portion, labeled with a heading named **Conditions**, contains settings that apply to *all series within* each condition. This section will include a **Marker Fill (__condition__)** for *each* of the conditions included in the data set. Selecting the dropdown for a condition allows you to choose a color for all series within that condition.

**Example:** Should you wish to have every marker in _Baseline_ to have a black fill, you would select **Marker Fill (Baseline)** and set it to black. Every key's marker in _Baseline_ is now black, unless you override a specific key (see the next section). Line colors do not change at the condition level, because lines stay black by default, unless these are changed at the individual series level. This is described in the sections below.

#### Styling: Series-specific Settings

It is most likely that users will desire to customize the appearance of individual series beyond the condition-wide settings. This allows for highlighting specific keys or making certain series stand out in the figure (e.g., alternative target with bright/contrasting colors). In these cases, settings provided by clicking the **Styles** can be used to override the key-specific settings in the figure as well.

Key-specific settings in the dialog are provided in the "Keys" section, where each key listed can be selected to reveal its individual styling options. Note: only a single key is presented at a single time and selecting a key brings up settings specific to that key. The series editor allows users to edit the **Shape** of the marker for that key, as well as its fill (**Marker Fill**) and **Line** colors per key and condition. A preview is provided beside the dropdown, showing the marker as it will look in that condition.

**Example:** An alternative target behavior, such as _Functional Communication_, may benefit from styling in a few different ways. Specifically, this response can be adjusted to include a distinct marker (e.g., a star) as well as unique colors to make it stand out in the figure (e.g., light blue in an otherwise black/white figure). In this example, it similarly would be helpful to de-emphasize aspects of this series in certain areas of the figure, such as Baseline. In this case, since the relevant target could not have taken place in baseline, we may adjust the style for this target and condition to have a 'hidden' marker and 'hidden' line specific to Baseline conditions. Doing this omits the series from being visually prominent in that condition, while still allowing it to stand out in other conditions where is it more meaningful to emphasize.

#### Resetting Styles

There are various combinations of styles available to users, and in conditions where styles have become problematic or confusing, it may be helpful to reset them to the default values. Users can click the **Reset All to Defaults** button to revert all series and condition styles back to their automatic defaults. Phase change lines and text annotations are not affected by this button.

#### Phase Lines and Text Annotations

Phase change lines and text annotations are not part of series styling, so they are documented separately in [Adding Phase Lines and Text Annotations to Figures](/documentation/019-figure_annotations). That entry covers how to add and edit each type, how text is scoped to the rate or proportion page, and how these annotations are saved.

### Closing Notes and Tips

There is considerable flexibility in how series can be styled and users are encouraged to experiment with different combinations to best convey the information in their figures. As a general note, the settings adjusted at the evaluation-level for an individual are cached on the local machine, so these settings should persist over time unless modified. That is, settings made at once time should persist as more data and conditions are added to the data set.
