![Static Badge](<https://img.shields.io/badge/Coverage_(Lines)-99.88%-green>) ![Static Badge](<https://img.shields.io/badge/Coverage_(Branches)-97.66%-green>) ![Static Badge](<https://img.shields.io/badge/Coverage_(Functions)-100.00%-green>)

![Static Badge](https://img.shields.io/badge/Version-0.4.2-blue) ![Static Badge](https://img.shields.io/badge/License-Apache_2.0-purple) [![Slack](https://img.shields.io/badge/Slack-4A154B?logo=slack&logoColor=fff)](https://datatrackerworkspace.slack.com/)

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff) ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=fff) ![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=fff) ![TailwindCSS](https://img.shields.io/badge/Tailwind%20CSS-%2338B2AC.svg?logo=tailwind-css&logoColor=white) ![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000?logo=shadcnui&logoColor=fff)

# DataTracker (Installable PWA Build)

DataTracker (PWA) is a web-base
d application that assists researchers and clinicians in measuring behavior of interest. This program can be used by multiple observers to record, and and later compare, behavior in real-time. This tool provides multiples methods for assessing the reliability of measurements (e.g., exact interval agreement), session-by-session viewing and interpretation (e.g., basic data displays), and the automation of clinical responsibilities (e.g., calculating response rates across contexts within sessions). It also supports a rudimentary method for syncing data across multiple devices in a purely local context (e.g., shared networked drive in air-gapped arrangement).

The goal of DataTracker is provide an open source tool for support various aspects of behavior therapy and behavioral research. This is an 'installable' program (i.e., it can be pinned to your desktop) that works in a native-like fashion that does not require accessing any app marketplace. It is presently platform-agnostic and **No data recorded or scored ever leaves your machine**. It is designed to be used by clinicians and researchers using Single-Case Experimental Design (SCEDs) to evaluate the effectiveness of interventions.

Features included in DataTracker (PWA) include:

- Cross-platform support for Windows, MacOS, and Linux (installable to Desktop via browser as Progressive Web App [PWA])
- Real-time recording of behavior with multiple observers
- Tools for calculation of reliability indices
- Automated updates and delivery
- Exporting of behavioral data in multiple formats (JSON, csv, etc.)
- Quick visualization of behavioral data across sessions/conditions
- Customizable approaches to designing measurement systems

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
- 0.2.9 - Add in support for importing keysets from other cases, cleaner hooks and workflow
- 0.3.0 - Add in support for importing evaluations from other cases
- 0.3.1 - Support for backing up data to a remote location
- 0.3.2 - Stable support for syncing data across folders
- 0.4.0 - Stable beta build with docs and features included
- 0.4.1 - Expanding on summary output--more data available for basic export
- 0.4.2 - Add in more robust tolerance for naming of keys in reliability calculations

## Features

The DataTracker application has been ported to a Progressive Web App (PWA), which is a way to flexibly manage strict requirements for data management as well as work within secure systems that require sandboxed applications. This program is designed to be installed on your desktop and run as a standalone application. It is not a 'native' application nor is it designed for mobile devices (e.g., tablets, phones).

![DataTracker Visualization](public/screenshots/landing_page.png 'DataTracker Options for Data Display')

The DataTracker program supports numerous strategies for summarizing and supporting the interpretation of individual behavior data across sessions/conditions.

![DataTracker Condition-level Visualization](public/screenshots/visualization.png 'DataTracker Options for Between-Session Data Display')

The program also provides support for analyzing _within session_ performances as well as across multiple stimulus conditions (i.e., contexts).

![DataTracker Within-Session Visualization](public/screenshots/within_session_preview.png 'DataTracker Options for Within-Session Data Display')

DataTracker mirrors existing conventions for electronic data collection (e.g., group-/study-level groupings).

![Group-level Organization](public/screenshots/group_editor.png 'Participant Organization')

There is active support for managing Key/Behavior mappings through user-generated keysets.

![Key Management](public/screenshots/key_editor.png 'Editor for Keyboards')

There are many options for designing sessions in real-time.

![Session Designer Page](public/screenshots/session_designer.png 'Session Designer')

Electronic data collection can be performed for both event and duration recording.

![Session Recorder Page](public/screenshots/session_recorder.png 'Session Recorder')

## Referenced Works

@hookform/resolvers (3.9.0). Copyright bluebill1049 <bluebill1049@hotmail.com> -- MIT Licensed: [Repo](https://github.com/react-hook-form/resolvers.git) 
 
@mdx-js/mdx (3.0.1). Copyright John Otander <johnotander@gmail.com> (https://johno.com) -- MIT Licensed: [Repo](https://github.com/mdx-js/mdx.git) 
 
@next/third-parties (14.2.13). Copyright n/a -- MIT Licensed: [Repo](https://github.com/vercel/next.js.git) 
 
@radix-ui/react-dialog (1.1.1). Copyright n/a -- MIT Licensed: [Repo](https://github.com/radix-ui/primitives.git) 
 
@radix-ui/react-dropdown-menu (2.1.1). Copyright n/a -- MIT Licensed: [Repo](https://github.com/radix-ui/primitives.git) 
 
@radix-ui/react-icons (1.3.0). Copyright n/a -- MIT Licensed: [Repo](https://registry.npmjs.org/@radix-ui/react-icons/-/react-icons-1.3.2.tgz) 
 
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
 
rehype-highlight (7.0.0). Copyright Titus Wormer <tituswormer@gmail.com> (https://wooorm.com) -- MIT Licensed: [Repo](https://github.com/rehypejs/rehype-highlight.git) 
 
scheduler (0.23.2). Copyright n/a -- MIT Licensed: [Repo](https://github.com/facebook/react.git) 
 
sonner (1.5.0). Copyright Emil Kowalski <e@emilkowal.ski> -- MIT Licensed: [Repo](https://github.com/emilkowalski/sonner.git) 
 
tailwind-merge (2.5.2). Copyright Dany Castillo -- MIT Licensed: [Repo](https://github.com/dcastil/tailwind-merge.git) 
 
tailwindcss-animate (1.0.7). Copyright Jamie Kyle <me@thejameskyle.com> -- MIT Licensed: [Repo](https://registry.npmjs.org/tailwindcss-animate/-/tailwindcss-animate-1.0.7.tgz) 
 
uuid (10.0.0). Copyright n/a -- MIT Licensed: [Repo](https://github.com/uuidjs/uuid.git) 
 
zod (3.23.8). Copyright Colin McDonnell <colin@colinhacks.com> -- MIT Licensed: [Repo](https://github.com/colinhacks/zod.git) 

## Acknowledgements

Bullock, C. E., Fisher, W. W., & Hagopian, L. P. (2017). Description and validation of a computerized behavioral data program:"BDataPro". The Behavior Analyst, 40, 275-285. doi: [10.1007/s40614-016-0079-0](https://doi.org/10.1007%2Fs40614-016-0079-0)

Gilroy, S. P. (2017-Present). DataTracker3. [Repo (GPL-3)](https://github.com/miyamot0/DataTracker3)

## License

Apache 2.0 - Shawn Gilroy, Louisiana State University

## Version

Version 0.4.2

