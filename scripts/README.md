![Static Badge](https://img.shields.io/badge/Version-{{VERSION_NUMBER}}-blue) ![Static Badge](https://img.shields.io/badge/License-Apache_2.0-purple)

# DataTracker (PWA Application)

DataTracker (PWA) is a web-based application that assists researchers and clinicians in measuring behavior of interest. This program can be used by multiple observers to record, and and later compare, behavior in real-time. This tool provides multiples methods for assessing the reliability of measurements (e.g., exact interval agreement), session-by-session viewing and interpretation (e.g., basic data displays), and the automation of clinical responsibilities (e.g., calculating response rates across contexts within sessions).

The goal of DataTracker is provide an open source tool for support various aspects of behavior therapy and behavioral research. This is an 'installable' program (i.e., it can be pinned to your desktop) that works in a more native fashion. **No data recorded or scored ever leaves your machine**.

Features included in DataTracker include:

- Cross-platform support for Windows, MacOS, and Linux (installable to Desktop via browser)
- Customizable methods for designing measurement systems
- Real-time recording of behavior with multiple observers
- Tools for calculation of reliability indices
- Automated updates and delivery
- Export behavioral data in multiple formats (JSON, xlsx, etc.)

## Changelog

- 0.2.0 - Minor bump, all key metrics/interpretations included
- 0.2.1 - Add in session viewer, minor bugfixes
- 0.2.2 - Filter functionality to screen out mobile hardware (not presently a priority)
- 0.2.3 - Port over to Vite for core build (full offline)
- 0.2.4 - Bring in wakelocks, screen/route transitions, to mirror native functionality
- 0.2.5 - Streamline docs and build
- 0.2.6 - Support for img in docs, add in fixes for session editor
- 0.2.7 - Add in support for syntax highlighting (docs related to data files)
- 0.2.8 - Tag manager to help with error logging, some UI changes for clarity

## Features

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

## Referenced Works

{{LICENSES}}

## Acknowledgements

Bullock, C. E., Fisher, W. W., & Hagopian, L. P. (2017). Description and validation of a computerized behavioral data program:"BDataPro". The Behavior Analyst, 40, 275-285. doi: [10.1007/s40614-016-0079-0](https://doi.org/10.1007%2Fs40614-016-0079-0)

Gilroy, S. P. (2017-Present). DataTracker3. [Repo (GPL-3)](https://github.com/miyamot0/DataTracker3)

## License

Apache 2.0 - Shawn Gilroy, Louisiana State University

## Version

{{VERSION}}
