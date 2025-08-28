![Static Badge Lines](<https://img.shields.io/badge/Coverage_(Lines)-100.00_Percent-green>) ![Static Badge Branches](<https://img.shields.io/badge/Coverage_(Branches)-98.84_Percent-green>) ![Static Badge Functions](<https://img.shields.io/badge/Coverage_(Functions)-100.00_Percent-green>)

![Static Badge Version](https://img.shields.io/badge/Version-0.4.6-blue) ![Static Badge License](https://img.shields.io/badge/License-Apache_2.0-purple)

# DataTracker (Installable PWA Build)

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff) ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=fff) ![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=fff) ![TailwindCSS](https://img.shields.io/badge/Tailwind%20CSS-%2338B2AC.svg?logo=tailwind-css&logoColor=white) ![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000?logo=shadcnui&logoColor=fff)

DataTracker is a web-based application (installable PWA) designed to assist researchers and clinicians with measuring behavior. This program can be used by multiple observers (e.g., a primary and secondary observer) to record, assess agreement/reliability, and later compare.

## Purpose and Rationale

The goal of DataTracker was to provide an open source tool for support various aspects of behavior therapy and behavioral research. This is an 'installable' program (i.e., it can be pinned to your desktop) that works in a native-like fashion that does not require accessing any app marketplace. It is presently platform-agnostic, and **No data recorded or scored ever leaves your machine**. It is designed to be used by clinicians and researchers using Single-Case Experimental Design (SCEDs) to evaluate the effectiveness of interventions.

This tool supports multiple methods of assessing reliability of behavioral measurement (e.g., exact interval agreement), session-by-session viewing and interpretation of data (e.g., basic data displays), and some automation of clinical responsibilities (e.g., calculating response rates across contexts within sessions). The tool also supports syncing data across multiple locations in a local context (e.g., shared networked drive in secure settings).

## Current and Planned Features

DataTracker has been ported to a PWA program, which is one way to flexibly manage requirements for data security as well as to work within secure systems that require strict administrative control (i.e., the program does not need user privileges to install).

This program can be easily installed as an 'app' (Note: PWAs are simply bundled websites) and access easily from your desktop as if it were a standalone application. It is not a 'native' application nor is it designed to be used for mobile devices at this time (e.g., tablets, phones).

Features include the following:

- [x] Versatile interface for designing measurement systems
- [x] Cross-platform support (installable as Progressive Web App [PWA])
- [x] Automated updates and delivery
- [x] Simultaneous recording of behavior across multiple observers
- [x] Various methods for calculating reliability indices
- [x] Manual export of data in multiple formats (i.e., JSON, CSV)
- [x] Quick visualization of behavioral data across sessions/conditions

## Screenshots and Visuals

![DataTracker Home Page](public/screenshots/landing_page.png 'Visual of landing page for program')

![DataTracker Data Visualization](public/screenshots/visualization.png 'DataTracker Options for Between-Session Data Display')

![DataTracker Data Visualization](public/screenshots/within_session_preview.png 'DataTracker Options for Within-Session Data Display')

![Group-level Organization](public/screenshots/group_editor.png 'Organization of Participant Data by Groups')

![Key Management](public/screenshots/key_editor.png 'Basic Editor for Keyboards Mappings')

![Session Designer Page](public/screenshots/session_designer.png 'Various options for designing session conditions')

![Session Recorder Page](public/screenshots/session_recorder.png 'Options for displaying session recording progress')

## Program Support

The PWA approach allows for easy installation and seamless updates over time. For support, there is a dedicated Slack channel for users to ask questions and troubleshoot issues. There is also a formal bug tracker available through GitHub to assist with identifying issues and submitting feature requests.

PRs will be considered on a case-by-case basis, but the project is primarily maintained by a single developer.

[![Slack Support Channel](https://img.shields.io/badge/Slack-4A154B?logo=slack&logoColor=fff)](https://datatrackerworkspace.slack.com/) [![GitHub Bug Tracker](https://img.shields.io/badge/GitHub-Issues-181717?logo=github&logoColor=fff)](https://github.com/miyamot0/datatracker-pwa/issues)

## Acknowledgements

The DataTracker project has been shaped by a range of behavior recording tools that have emerged over the years. Notable inspirations include:

Bullock, C. E., Fisher, W. W., & Hagopian, L. P. (2017). Description and validation of a computerized behavioral data program:"BDataPro". The Behavior Analyst, 40, 275-285. DOI: [10.1007/s40614-016-0079-0](https://doi.org/10.1007%2Fs40614-016-0079-0)

Gilroy, S. P. (2017-Present). DataTracker3. [Repo (GPL-3)](https://github.com/miyamot0/DataTracker3)

## Open Source Licenses

@hookform/resolvers (3.9.0). Copyright bluebill1049 <bluebill1049@hotmail.com> -- MIT Licensed: [Repo](n/a) 
 
@mdx-js/mdx (3.0.1). Copyright John Otander <johnotander@gmail.com> (https://johno.com) -- MIT Licensed: [Repo](n/a) 
 
@next/third-parties (14.2.13). Copyright n/a -- MIT Licensed: [Repo](n/a) 
 
@radix-ui/react-checkbox (1.3.2). Copyright n/a -- MIT Licensed: [Repo](n/a) 
 
@radix-ui/react-dialog (1.1.1). Copyright n/a -- MIT Licensed: [Repo](n/a) 
 
@radix-ui/react-dropdown-menu (2.1.1). Copyright n/a -- MIT Licensed: [Repo](n/a) 
 
@radix-ui/react-icons (1.3.0). Copyright n/a -- MIT Licensed: [Repo](n/a) 
 
@radix-ui/react-label (2.1.0). Copyright n/a -- MIT Licensed: [Repo](n/a) 
 
@radix-ui/react-menubar (1.1.1). Copyright n/a -- MIT Licensed: [Repo](n/a) 
 
@radix-ui/react-scroll-area (1.1.0). Copyright n/a -- MIT Licensed: [Repo](n/a) 
 
@radix-ui/react-select (2.1.1). Copyright n/a -- MIT Licensed: [Repo](n/a) 
 
@radix-ui/react-slot (1.1.0). Copyright n/a -- MIT Licensed: [Repo](n/a) 
 
@radix-ui/react-switch (1.1.0). Copyright n/a -- MIT Licensed: [Repo](n/a) 
 
@radix-ui/react-tooltip (1.1.2). Copyright n/a -- MIT Licensed: [Repo](n/a) 
 
@tanstack/react-table (8.21.3). Copyright Tanner Linsley -- MIT Licensed: [Repo](n/a) 
 
class-variance-authority (0.7.0). Copyright Joe Bell (https://joebell.co.uk) -- Apache-2.0 Licensed: [Repo](n/a) 
 
clsx (2.1.1). Copyright Luke Edwards luke.edwards05@gmail.com https://lukeed.com -- MIT Licensed: [Repo](n/a) 
 
embla-carousel-react (8.2.1). Copyright David Jerleke -- MIT Licensed: [Repo](n/a) 
 
esbuild (0.25.9). Copyright n/a -- MIT Licensed: [Repo](n/a) 
 
lucide-react (0.429.0). Copyright Eric Fennis -- ISC Licensed: [Repo](n/a) 
 
react (18.3.1). Copyright n/a -- MIT Licensed: [Repo](n/a) 
 
react-dom (18.3.1). Copyright n/a -- MIT Licensed: [Repo](n/a) 
 
react-hook-form (7.53.0). Copyright <bluebill1049@hotmail.com> -- MIT Licensed: [Repo](n/a) 
 
react-router-dom (6.26.2). Copyright Remix Software <hello@remix.run> -- MIT Licensed: [Repo](n/a) 
 
react-spreadsheet (0.9.5). Copyright Iddan Aaronsohn <mail@aniddan.com> (https://aniddan.com) -- MIT Licensed: [Repo](n/a) 
 
react-use-pwa-install (1.0.1). Copyright Filip Chalupa chalupa.filip@gmail.com https://www.npmjs.com/~onset -- ISC Licensed: [Repo](n/a) 
 
recharts (2.15.3). Copyright recharts group -- MIT Licensed: [Repo](n/a) 
 
rehype-highlight (7.0.0). Copyright Titus Wormer <tituswormer@gmail.com> (https://wooorm.com) -- MIT Licensed: [Repo](n/a) 
 
scheduler (0.23.2). Copyright n/a -- MIT Licensed: [Repo](n/a) 
 
sonner (1.5.0). Copyright Emil Kowalski <e@emilkowal.ski> -- MIT Licensed: [Repo](n/a) 
 
tailwind-merge (2.5.2). Copyright Dany Castillo -- MIT Licensed: [Repo](n/a) 
 
tailwindcss-animate (1.0.7). Copyright Jamie Kyle <me@thejameskyle.com> -- MIT Licensed: [Repo](n/a) 
 
uuid (10.0.0). Copyright n/a -- MIT Licensed: [Repo](n/a) 
 
zod (3.23.8). Copyright Colin McDonnell <colin@colinhacks.com> -- MIT Licensed: [Repo](n/a) 

## License

Apache 2.0 - Shawn Gilroy, Louisiana State University

## Current Version

0.4.6
