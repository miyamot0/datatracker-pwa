![Static Badge](https://img.shields.io/badge/Version-0.2.2-blue) ![Static Badge](https://img.shields.io/badge/License-Apache_2.0-purple) ![Static Badge](https://img.shields.io/badge/Coverage-{{PERCENTAGE}}-{{PERCENTAGE_COLOR}})

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

@hookform/resolvers (3.9.0). Copyright bluebill1049 <bluebill1049@hotmail.com> -- MIT Licensed: [Repo](https://github.com/react-hook-form/resolvers.git) 
 
@mdx-js/mdx (3.0.1). Copyright John Otander <johnotander@gmail.com> (https://johno.com) -- MIT Licensed: [Repo](https://github.com/mdx-js/mdx.git) 
 
@mdx-js/react (3.0.1). Copyright John Otander <johnotander@gmail.com> (https://johno.com) -- MIT Licensed: [Repo](https://github.com/mdx-js/mdx.git) 
 
@radix-ui/react-dialog (1.1.1). Copyright n/a -- MIT Licensed: [Repo](https://github.com/radix-ui/primitives.git) 
 
@radix-ui/react-dropdown-menu (2.1.1). Copyright n/a -- MIT Licensed: [Repo](https://github.com/radix-ui/primitives.git) 
 
@radix-ui/react-icons (1.3.0). Copyright n/a -- MIT Licensed: [Repo](https://registry.npmjs.org/@radix-ui/react-icons/-/react-icons-1.3.0.tgz) 
 
@radix-ui/react-label (2.1.0). Copyright n/a -- MIT Licensed: [Repo](https://github.com/radix-ui/primitives.git) 
 
@radix-ui/react-menubar (1.1.1). Copyright n/a -- MIT Licensed: [Repo](https://github.com/radix-ui/primitives.git) 
 
@radix-ui/react-scroll-area (1.1.0). Copyright n/a -- MIT Licensed: [Repo](https://github.com/radix-ui/primitives.git) 
 
@radix-ui/react-select (2.1.1). Copyright n/a -- MIT Licensed: [Repo](https://github.com/radix-ui/primitives.git) 
 
@radix-ui/react-slot (1.1.0). Copyright n/a -- MIT Licensed: [Repo](https://github.com/radix-ui/primitives.git) 
 
@radix-ui/react-switch (1.1.0). Copyright n/a -- MIT Licensed: [Repo](https://github.com/radix-ui/primitives.git) 
 
@radix-ui/react-tooltip (1.1.2). Copyright n/a -- MIT Licensed: [Repo](https://github.com/radix-ui/primitives.git) 
 
class-variance-authority (0.7.0). Copyright Joe Bell (https://joebell.co.uk) -- Apache-2.0 Licensed: [Repo](https://github.com/joe-bell/cva.git) 
 
clsx (2.1.1). Copyright Luke Edwards luke.edwards05@gmail.com https://lukeed.com -- MIT Licensed: [Repo](https://github.com/lukeed/clsx.git) 
 
embla-carousel-react (8.2.1). Copyright David Jerleke -- MIT Licensed: [Repo](https://github.com/davidjerleke/embla-carousel) 
 
lucide-react (0.429.0). Copyright Eric Fennis -- ISC Licensed: [Repo](https://github.com/lucide-icons/lucide.git) 
 
react (18.3.1). Copyright n/a -- MIT Licensed: [Repo](https://github.com/facebook/react.git) 
 
react-dom (18.3.1). Copyright n/a -- MIT Licensed: [Repo](https://github.com/facebook/react.git) 
 
react-hook-form (7.53.0). Copyright <bluebill1049@hotmail.com> -- MIT Licensed: [Repo](https://github.com/react-hook-form/react-hook-form.git) 
 
react-router-dom (6.26.2). Copyright Remix Software <hello@remix.run> -- MIT Licensed: [Repo](https://github.com/remix-run/react-router.git) 
 
react-spreadsheet (0.9.5). Copyright Iddan Aaronsohn <mail@aniddan.com> (https://aniddan.com) -- MIT Licensed: [Repo](https://github.com/iddan/react-spreadsheet.git) 
 
react-use-pwa-install (1.0.1). Copyright Filip Chalupa chalupa.filip@gmail.com https://www.npmjs.com/~onset -- ISC Licensed: [Repo](https://github.com/FilipChalupa/react-use-pwa-install.git) 
 
recharts (2.12.7). Copyright recharts group -- MIT Licensed: [Repo](https://github.com/recharts/recharts.git) 
 
scheduler (0.23.2). Copyright n/a -- MIT Licensed: [Repo](https://github.com/facebook/react.git) 
 
sonner (1.5.0). Copyright Emil Kowalski <e@emilkowal.ski> -- MIT Licensed: [Repo](https://github.com/emilkowalski/sonner.git) 
 
tailwind-merge (2.5.2). Copyright Dany Castillo -- MIT Licensed: [Repo](https://github.com/dcastil/tailwind-merge.git) 
 
tailwindcss-animate (1.0.7). Copyright Jamie Kyle <me@thejameskyle.com> -- MIT Licensed: [Repo](https://registry.npmjs.org/tailwindcss-animate/-/tailwindcss-animate-1.0.7.tgz) 
 
uuid (10.0.0). Copyright n/a -- MIT Licensed: [Repo](https://github.com/uuidjs/uuid.git) 
 
vite-plugin-mdx (3.6.0). Copyright n/a -- MIT Licensed: [Repo](https://github.com/brillout/vite-plugin-mdx.git) 
 
vite-plugin-mdx-plus (1.1.1). Copyright Codpoe <codpoe.me@gmail.com> -- MIT Licensed: [Repo](https://github.com/Codpoe/vite-plugin-mdx-plus.git) 
 
zod (3.23.8). Copyright Colin McDonnell <colin@colinhacks.com> -- MIT Licensed: [Repo](https://github.com/colinhacks/zod.git) 

## Acknowledgements:

Bullock, C. E., Fisher, W. W., & Hagopian, L. P. (2017). Description and validation of a computerized behavioral data program:"BDataPro". The Behavior Analyst, 40, 275-285. doi: [10.1007/s40614-016-0079-0](https://doi.org/10.1007%2Fs40614-016-0079-0)

Gilroy, S. P. (2017-Present). DataTracker3. [Repo (GPL-3)](https://github.com/miyamot0/DataTracker3)

## License:

Apache 2.0 - Shawn Gilroy, Louisiana State University

## Version:

Version 0.2.2

