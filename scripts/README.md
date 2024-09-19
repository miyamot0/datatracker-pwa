![Static Badge](https://img.shields.io/badge/Version-{{VERSION_NUMBER}}-blue) ![Static Badge](https://img.shields.io/badge/License-Apache_2.0-purple) ![Static Badge](https://img.shields.io/badge/Coverage-{{PERCENTAGE}}-{{PERCENTAGE_COLOR}})

# DataTracker (PWA Application)

DataTracker (PWA) is a web-based application that assists researchers and clinicians in measuring behavior of interest. This program can be used by multiple observers to record, and and later compare, behavior in real-time. This tool provides multiples methods for assessing the reliability of measurements (e.g., exact interval agreement), session-by-session viewing and interpretation (e.g., basic data displays), and the automation of clinical responsibilities (e.g., calculating response rates across contexts within sessions).

The goal of DataTracker is provide an open source tool for support various aspects of behavior therapy and behavioral research. This is an 'installable' program (i.e., it can be pinned to your desktop) that works in a more native fashion. **No data recorded or scored ever leaves your machine**.

Features included in DataTracker include:

- Cross-platform support for Windows, Mac, and Linux (only Ubuntu tested)
- Customizable methods for designing measurement systems
- Real-time recording of behavior with multiple observers
- Tools for calculation of reliability indices
- Optionally automate reliability measures and reports as new data is added
- Automated update delivery, for keeping up to date with new features and bug fixes
- Options for saving behavioral data in multiple locations and formats (JSON, xlsx, etc.)
- Saving data in a range of common formats
- Calculation of IOA/Reliability in multiple formats

## Changelog:

- 0.1.0 - Initial alpha release
- 0.1.1 - Core functionality introduced
- 0.1.3 - Incorporate PWA functionality for updating
- 0.1.4 - Introduce licensing documentation
- 0.1.5 - Add documentation for DataTracker operation
- 0.1.6 - Updates for dark mode
- 0.1.7 - Manual Prompt for Install, Expanding Documentation
- 0.1.9 - Add in initial figure design
- 0.2.0 - Minor bump, all key metrics/interpretations included
- 0.2.1 - Add in session viewer, minor bugfixes
- 0.2.2 - Filter functionality to screen out mobile hardware (not presently a priority)

## Features:

The DataTracker application has been ported to a Progressive Web App (PWA), which is a way to flexibly manage strict requirements for data management as well as work within secure systems that require sandboxed applications.

![DataTracker Visualization](public/screenshots/landing_page.png 'DataTracker Options for Data Display')

The DataTracker program features numerous strategious for summarizing and supporting the interpretation of individual behavior data.

![DataTracker Within-Session Visualization](public/screenshots/within_session_preview.png 'DataTracker Options for Within-Session Data Display')

The program also provides support for analyzing performances _within-session_ and across multiple timers/changes in context.

![DataTracker Landing Page](public/screenshots/landing_page.png 'DataTracker Home Page')

DataTracker mirrors existing conventions for electronic data collection (e.g., group-/study-level groupings).

![Group-level Organization](public/screenshots/group_editor.png 'Participant Organization')

There is active support for managing Key/Behavior mappings through user-generated keysets.

![Key Management](public/screenshots/key_editor.png 'Editor for Keyboards')

There are many options for designing sessions in real-time.

![Session Designer Page](public/screenshots/session_designer.png 'Session Designer')

Electronic data collection can be performed for both event and duration recording.

![Session Recorder Page](public/screenshots/group_editor.png 'Session Recorder')

## Referenced Works:

{{LICENSES}}

## Acknowledgements:

Bullock, C. E., Fisher, W. W., & Hagopian, L. P. (2017). Description and validation of a computerized behavioral data program:"BDataPro". The Behavior Analyst, 40, 275-285. doi: [10.1007/s40614-016-0079-0](https://doi.org/10.1007%2Fs40614-016-0079-0)

Gilroy, S. P. (2017-Present). DataTracker3. [Repo (GPL-3)](https://github.com/miyamot0/DataTracker3)

## License:

Apache 2.0 - Shawn Gilroy, Louisiana State University

## Version:

{{VERSION}}
