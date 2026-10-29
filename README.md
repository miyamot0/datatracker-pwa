![Static Badge Lines](<https://img.shields.io/badge/Coverage_(Lines)-91.51_Percent-green>) ![Static Badge Branches](<https://img.shields.io/badge/Coverage_(Branches)-89.78_Percent-green>) ![Static Badge Functions](<https://img.shields.io/badge/Coverage_(Functions)-90.30_Percent-green>)

![Static Badge Version](https://img.shields.io/badge/Version-0.5.15-blue) ![Static Badge License](https://img.shields.io/badge/License-Apache_2.0-purple)

[![GitHub Bug Tracker](https://img.shields.io/badge/GitHub-Issues-181717?logo=github&logoColor=fff)](https://github.com/miyamot0/datatracker-pwa/issues) [![Slack Support Channel](https://img.shields.io/badge/Slack-4A154B?logo=slack&logoColor=fff)](https://datatrackerworkspace.slack.com/)

# DataTracker (Installable PWA Build)

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff) ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=fff) ![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=fff) ![TailwindCSS](https://img.shields.io/badge/Tailwind%20CSS-%2338B2AC.svg?logo=tailwind-css&logoColor=white) ![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000?logo=shadcnui&logoColor=fff)

DataTracker is a portable web application (PWA) designed to assist researchers and clinicians with observing and recording behavior for clinical or other research purposes. This program can be used by multiple observers (e.g., a primary and secondary rater) to record and quantify behavior (i.e., frequency/rate, duration/proportion), assess agreement and reliability between raters, and summarize these outcomes for clinical or research purposes.

## Program Description

The goal of DataTracker was to provide an open source tool for support various aspects of behavior therapy and behavioral research. This is an 'installable' program (i.e., it can be pinned to your desktop) that works in a native-like fashion but does not require accessing any app marketplace. The program is largely platform-agnostic, but can be installed from the Windows Marketplace if more convenient (i.e., the result is the same PWA in either case).

The program is a free tool designed to be used in secure environments (e.g., hospitals, schools). It is designed to work with minimal privileges and is largely specialized to Single-Case Experimental Design (SCED) methodologies. It is largely reminiscent of legacy desktop applications (e.g., DataTracker3) but is designed to be more flexible and adaptable to a range of use cases, machines, and settings.

### Current and Planned Features

DataTracker has been ported to a PWA program, which is one way to flexibly balance requirements for data security in secure systems with administrative control (i.e., the program does not need user privileges to install). The app is designed to provide high-performance, real-time data collection through the use of modern timing conventions and web-workers (i.e., SharedArrayBuffers, MessageChannel). It presently provides latency and fidelity consistent with native alternatives with broad support across browsers and machines.

This PWA can be easily installed as a Desktop 'app' (Note: PWAs are simply bundled websites) and accessed easily from your desktop as if it were a standalone application. It is not a true 'native' application and the program as designed does not support mobile devices at this time (i.e., modeled around keyboard entry).

Features include the following:

- [x] Cross-platform support (installable as Progressive Web App [PWA])
- [x] Automated updates and delivery of bug fixes and new features
- [x] Versatile interface for designing measurement systems
- [x] Simultaneous recording of behavior across multiple observers with sync support
- [x] Highly-optimized real-time data recording with millisecond-level fidelity
- [x] Automated calculations of interobserver agreement (IOA) across multiple methods
- [x] Automated visualization and summarization tools (e.g., visual analysis)
- [x] Support for deriving new keys/targets based on existing keys (e.g., percentage of compliance, multiple targets in a shared response class)
- [x] Support for duration logging that permits inter-scoring (i.e., events occurring during a respective) period or periods of time (e.g., 30s intervals)
- [x] Manual export of data in multiple formats (i.e., JSON, CSV)

### Changelog

#### 0.5.15 (2026-06-27):

- Round out visual package (i.e., annotations)
- Improvements to error reporting

#### 0.5.14 (2026-06-26):

- Updates to series styling and figure customization options
- Changes to persistence of series styling settings across sessions
- Updates for dependencies

#### 0.5.10 (2026-04-28):

- Sync widget expanded to include for targeted filtering
- More responsive/intuitive UI for syncing (for syncing of large folders)

#### 0.5.9 (2026-04-21):

- Visualizer expansion (hide specific conditions as relevant)
- Restore total session time scoring (mistakenly removed in 0.5.8)
- Sorting in reli widget--filter by specific Primary/Reli raters

### Islanded Mode for Highly Secure Environments

In addition to the standard PWA build, there is also an 'islanded' mode that allows for use in highly secure environments where internet access is restricted (i.e., internet access is white-list only) or virtually unavailable (i.e., all non-internal traffic is blocked). This mode is designed to function entirely offline after the initial installation, essentially fully cached, ensuring that data remains local to the device at all times. In practice, this would be similar to an 'on-prem' solution that would not have any external dependencies (or updates, for that matter).

This is not provided via the hosted site per se, but rather, is available for download and installation by users who need this level of security. The islanded version includes all the features of the standard PWA but is optimized for environments with more stringent data security requirements (e.g., hospital security with largely whitelisted network access, air-gapped machines, etc.).

Islanded builds are compiled as main branch releases and are made available via the [GitHub releases page](https://github.com/miyamot0/datatracker-pwa/releases).

### Docker/Self-hosting/On-prem Install

Suggested for use in highly secure environments, the program can be run in a Docker container. This allows for a more controlled environment and can be used to ensure that the program is running in a secure and isolated manner (e.g., air-gapped networks, whitelisted network access, no outbound access, loopback to nowhere).

The following commands can be used to run the program in a Docker container. Note: First command creates an isolated network for the container to run in (so it does not have access to the external network) and the second command runs the container within that isolated network pulling the latest image from the Docker repository. The address of each docker container and version is available at [https://hub.docker.com/repository/docker/miyamot0/datatracker](https://hub.docker.com/repository/docker/miyamot0/datatracker).

```bash
docker network create --internal isolation_lan 2>/dev/null || true

docker run -d \
  --name datatracker \
  --network isolation_lan \
  --read-only \
  --cap-drop ALL \
  --security-opt no-new-privileges \
  --tmpfs /tmp \
  --tmpfs /run:mode=1777 \
  -p 127.0.0.1:8080:8080 \
  miyamot0/datatracker:latest
```

### Screenshots and Visuals

![DataTracker Home Page](public/screenshots/home_page.png 'Visual of landing page for program')

![DataTracker Data Visualization](public/screenshots/rate_visuals_page.png 'DataTracker Options for Between-Session Data Display')

![DataTracker Data Visualization](public/screenshots/session_viewer_content_page.png 'DataTracker Options for Within-Session Data Display')

![Group-level Organization](public/screenshots/groups_authorized_page.png 'Organization of Participant Data by Groups')

![Key Management](public/screenshots/keyset_editor_page.png 'Basic Editor for Keyboards Mappings')

![Session Designer Page](public/screenshots/session_designer_page.png 'Various options for designing session conditions')

![Session Recorder Page](public/screenshots/session_recorder_page.png 'Options for displaying session recording progress')

### Program Support

The PWA approach allows for easy installation and seamless updates as they are released. The program is currently under active evaluation and new features and fixes will be pushed as developed and evaluated. Generally, the program will fetch updates from the secure hosting site (i.e., datatracker.smallnstats.com via HTTPS) without any specific action required by the user. The program will check for updates at startup and will automatically download and apply them in the background.

Bugs, issues, and other problems can be reported through the GitHub issue tracker, which is monitored by the developer. Users are encouraged to submit detailed reports of any issues they encounter, including steps to reproduce the problem and any relevant screenshots or error messages. This helps ensure that issues can be addressed promptly and effectively. Screenshots can be help to include as well with written descriptions of the issue to help with troubleshooting and resolution. Issue and bug tracking is provided through the [GitHub Bug Tracker](https://github.com/miyamot0/datatracker-pwa/issues).

Support can be provided via email; however, there is a dedicated Slack channel for users to ask questions and troubleshoot issues. The [Slack Support Channel](https://datatrackerworkspace.slack.com/) is the preferred method for support, as it allows for more immediate responses and facilitates community engagement among users. Users can join the Slack workspace to connect with the developer and other users for support and discussion.

### Collaboration and Contributions

The DataTracker project is open source and welcomes contributions from the community. However, given the specialized nature of the program and the need for careful consideration of changes to ensure data integrity and security, contributions are evaluated on a case-by-case basis. The project is currently maintained by a single developer, and while contributions are appreciated, they may not be accepted if they do not align with the project's goals or if they introduce potential issues.

PRs that appear to be AI-generated may be automatically without review, given the potential for introducing errors or inconsistencies that may impact clinical service.

## Acknowledgements

The DataTracker project has been shaped by a range of behavior recording tools that have emerged over the years. Notable inspirations include:

Bullock, C. E., Fisher, W. W., & Hagopian, L. P. (2017). Description and validation of a computerized behavioral data program:"BDataPro". The Behavior Analyst, 40, 275-285. DOI: [10.1007/s40614-016-0079-0](https://doi.org/10.1007%2Fs40614-016-0079-0)

Gilroy, S. P. (2017-Present). DataTracker3. [Repo (GPL-3)](https://github.com/miyamot0/DataTracker3)

## Open Source Licenses

@radix-ui/react-checkbox (1.4.1). Copyright n/a -- MIT Licensed: [Repo](https://github.com/radix-ui/primitives.git) 
 
@radix-ui/react-dialog (1.3.1). Copyright n/a -- MIT Licensed: [Repo](https://github.com/radix-ui/primitives.git) 
 
@radix-ui/react-dropdown-menu (2.2.1). Copyright n/a -- MIT Licensed: [Repo](https://github.com/radix-ui/primitives.git) 
 
@radix-ui/react-menubar (1.2.1). Copyright n/a -- MIT Licensed: [Repo](https://github.com/radix-ui/primitives.git) 
 
@radix-ui/react-scroll-area (1.4.0). Copyright n/a -- MIT Licensed: [Repo](https://github.com/radix-ui/primitives.git) 
 
@radix-ui/react-select (2.4.1). Copyright n/a -- MIT Licensed: [Repo](https://github.com/radix-ui/primitives.git) 
 
@radix-ui/react-slot (1.5.0). Copyright n/a -- MIT Licensed: [Repo](https://github.com/radix-ui/primitives.git) 
 
@radix-ui/react-tabs (1.2.1). Copyright n/a -- MIT Licensed: [Repo](https://github.com/radix-ui/primitives.git) 
 
@radix-ui/react-tooltip (1.4.1). Copyright n/a -- MIT Licensed: [Repo](https://github.com/radix-ui/primitives.git) 
 
@tanstack/react-hotkeys (0.10.0). Copyright Tanner Linsley -- MIT Licensed: [Repo](https://github.com/TanStack/hotkeys.git) 
 
@tanstack/react-query (5.104.5). Copyright tannerlinsley -- MIT Licensed: [Repo](https://github.com/TanStack/query.git) 
 
@tanstack/react-router (1.170.46). Copyright Tanner Linsley -- MIT Licensed: [Repo](https://github.com/TanStack/router.git) 
 
@tanstack/react-table (8.21.3). Copyright Tanner Linsley -- MIT Licensed: [Repo](https://github.com/TanStack/table.git) 
 
class-variance-authority (0.7.1). Copyright Joe Bell (https://joebell.co.uk) -- Apache-2.0 Licensed: [Repo](https://github.com/joe-bell/cva.git) 
 
clsx (2.1.1). Copyright Luke Edwards luke.edwards05@gmail.com https://lukeed.com -- MIT Licensed: [Repo](https://github.com/lukeed/clsx.git) 
 
fflate (0.8.3). Copyright Arjun Barrett <arjunbarrett@gmail.com> -- MIT Licensed: [Repo](https://github.com/101arrowz/fflate.git) 
 
lucide-react (0.577.0). Copyright Eric Fennis -- ISC Licensed: [Repo](https://github.com/lucide-icons/lucide.git) 
 
react (19.3.1). Copyright n/a -- MIT Licensed: [Repo](https://github.com/react/react.git) 
 
react-dom (19.3.1). Copyright n/a -- MIT Licensed: [Repo](https://github.com/react/react.git) 
 
react-hook-form (7.91.0). Copyright Beier(Bill) Luo <bluebill1049@hotmail.com> -- MIT Licensed: [Repo](https://github.com/react-hook-form/react-hook-form.git) 
 
react-use-pwa-install (1.0.3). Copyright Filip Chalupa chalupa.filip@gmail.com https://www.npmjs.com/~onset -- ISC Licensed: [Repo](https://github.com/FilipChalupa/react-use-pwa-install.git) 
 
recharts (3.10.1). Copyright recharts group -- MIT Licensed: [Repo](https://github.com/recharts/recharts.git) 
 
sonner (2.0.8). Copyright Emil Kowalski <e@emilkowal.ski> -- MIT Licensed: [Repo](https://github.com/emilkowalski/sonner.git) 
 
tailwind-merge (2.6.1). Copyright Dany Castillo -- MIT Licensed: [Repo](https://github.com/dcastil/tailwind-merge.git) 
 
zod (4.6.7). Copyright Colin McDonnell <zod@colinhacks.com> -- MIT Licensed: [Repo](https://github.com/colinhacks/zod.git) 

## License

Apache 2.0 - Shawn Gilroy, Louisiana State University

## Current Version

0.5.15