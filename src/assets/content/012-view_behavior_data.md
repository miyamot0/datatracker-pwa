---
title: Reviewing and Exporting Behavioral Data
description: This documentation entry provides an overview of the DataTracker's 'View Evaluation Data' page, including its purpose, structure, and how to interpret and export data from an Evaluation.
date: 04/15/2026
keywords: 'Data Collection, Visual Analysis, Data Export'
author: 'Shawn Gilroy'
index: 12
---

The DataTracker provides a way to view the data from an **Evaluation**. This is useful for inspecting the data that was collected during for a session as well as across various sessions and conditions (e.g., Attention, Demand conditions of functional analysis). Options for working with saved **Evaluation** data can be found by selecting the **Summarize Evaluation Data** from the dropdown menu in the **Evaluation** page. Clicking on this entry in the dropdown will navigate to the **Summarize Evaluation Data** page.

### Interpreting Saved Session Data

The **View Evaluation Data** page provides a table of the data collected during the **Evaluation**. The table provides information related to the _rate_ of behavior for "Frequency" keys and the _proportion_ of session time for "Duration" keys. When in doubt, the most clear and straightforward representation is the "Count" or "Seconds" recorded for each key per the respective timer.

#### Frequency Data Table

The frequency data table provides a summary of the data collected during the **Evaluation**. The data includes a "Count" for each Session and a _rate_ is calculated for the **Total Session Time**; however, this may or may not be the information most useful for a given **Evaluation**. For example, if the session incorporated **two timers**, you would likely wish to calculate rate based on the minutes recorded in either "Timer #1" or "Timer #2" rather than the "Total Timer". A visual of hypothetical data is provided below:

![Image of DataTracker data (Frequency)](docs/evaluation_summary_frequency.png 'Image of DataTracker data (Frequency)')

Within this table, information is summarized with respect to individual timers. For example, rate for Timer #1 would be reflected as the number of occurrences for a target response while that timer was active divided by the total time that Timer #1 was active. This is useful for comparing the rate of behavior across different conditions or timers within the same session.

Additionally, beyond system-level timers (e.g., Timer #1, Timer #2), users can explore the rates and durations of events per Special Duration Keys as well. These are duration keys that function as timers as well, which provide more flexibility in both guiding session as well as quantifying behavior. Options to score available data per these periods are provided in the same dropdown as the systems-level Timers.

#### Duration Data Table

The duration data table provides a summary of the data collected during the **Evaluation**. The data includes a "Seconds" for each Session and a _proportion_ of the **Total Session Time**; however, this may or may not be the information most useful for your **Evaluation**. For example, if the session incorporated **two timers**, you would likely wish to calculate the proportion of session based on the minutes recorded in either "Timer #1" or "Timer #2" rather than the "Total Timer".

![Image of DataTracker data (Duration)](docs/evaluation_summary_duration.png 'Image of DataTracker data (Duration)')

Within this table, information is summarized with respect to individual timers and timer duration. For example, the proportion of time for Timer #1 would be reflected as the number of seconds for a target response while that timer was active divided by the total time that Timer #1 was active. This is useful for comparing the proportion of time spent engaging in behavior across different conditions or timers within the same session.

Additionally, beyond system-level timers (e.g., Timer #1, Timer #2), users can explore the rates and durations of events per Special Duration Keys as well. These are duration keys that function as timers as well, which provide more flexibility in both guiding session as well as quantifying behavior. Options to score available data per these periods are provided in the same dropdown as the systems-level Timers.

### Exporting Data

The **View Evaluation Data** page provides an option to export the data collected during the **Evaluation**. The data can be exported as a CSV file or as a JSON file. In short, the CSV file type is best for viewing the data in a spreadsheet program, while the JSON file type is best for viewing the data in a text editor or for use in a programming environment. Multiple formats are provided to ensure that the data can be used in a variety of ways.

### Derived Keys/Targets

The Derived Key functionality provides considerable flexibility for tracking and organizing behavior and these calculations are made available across several areas of the program. These scores are calculated dynamically (i.e., on-the-fly) at the individual session level and are available in the data summary for each evaluation. This allows users to easily analyze and interpret the data collected during sessions, providing insights into behavior patterns and the effectiveness of interventions (e.g., compliance specific to select contexts/periods in a single session).

Additionally, these keys can be adjusted as needed to reflect changes in the intervention plan or to track new behavior patterns that emerge during the course of the evaluation. Changing these does not add or create additional scores and users are free to determine which arrangements best fit their purposes.
