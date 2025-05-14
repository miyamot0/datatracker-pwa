---
title: Program Use, Installation Options, and General Guidance
description: This documentation entry provides a brief overview of the DataTracker program, its intended audience, common uses for the program, and some of the conventions reflected in its design (i.e., how the program is structured and the reasons for doing so).
date: 08/31/2024
keywords: 'New Users, Program Use, Installation'
author: 'Shawn Gilroy'
---

Thank you for your interest in the DataTracker electronic data collection program!

The DataTracker program is the product of numerous collaborations with single-case experimental design (SCED) researchers over several years. The core aim of the program is to be _simple_, _useful_, _consistent_, and _reliable_ for conducting realtime behavioral research and rendering behavioral therapy. It is a free and open source computer program that can be used freely by anyone and requires only a internet-capable computer to operate (Note: Internet only required for initial install and updates).

The purpose of this documentation entry is to provide a brief overview of the software, it's intended audience, common uses for the program, and some of the conventions reflected in its design (i.e., how the program is structured and the reasons for doing so).

### Program Structure and Functionality

The DataTracker program is, at its core, **is a type of website**. The website functions as a **Progressive Web Application** or **"PWA"**, which is a hybrid between a traditional 'app' and a website. Although distinct from typical compiled computer programs, there are many similarities between PWAs and 'native' programs (e.g., those downloaded and installed from the internet or 'app' marketplaces). The DataTracker program works as any website would (i.e., you can use your browser to navigate there on the web); However, it can be _installed_ on your computer and used as a fully offline program as well. For example, you may 'pin' the program to your Dock/Taskbar or create a desktop shortcut to access the program quickly. Installing the program in this way removes the need for the internet, which grants the program the flexibility afforded to websites and users the convenience offered when by traditional 'native' programs.

The decision to adopt a PWA approach was carefully considered in order to balance modern considerations of SCED clinicians and researchers. The PWA model allows for various benefits, such as: offline operation, seamless updates, a 'native'-like experience, cross-platform compatibility, and a more secure environment for users (i.e., no need for administrator privileges on secure machines). This model is increasingly relevant as the field of SCED research moves towards more digital and online tools along with greater expectations for security and privacy.

There are some caveats to the PWA model and the interface featured in DataTracker. First, the DataTracker program is designed to be used on a **desktop or laptop computer**. This is because the numerous behavioral targets tracked in SCED research _often requires_ a physical keyboard to support simultaneous recording. Second, the methods for securely organizing data rests on the local file system of the user's computer. Mobile devices, such as tablets or smartphones, do not have the same level of access to the file system as a desktop or laptop computer (e.g., there is no direct access to a native file system). Although most any modern computer should be appropriate for DataTracker, it is recommended to use the program on a larger laptop screen or external monitor, especially when many targets are being recorded simultaneously.

### Installation Options

You _should_ be able to install DataTracker on your machine by using any browser of your choosing. Although many browser options exist, the program is most heavily tested for use with **Google Chrome** and **Microsoft Edge**. Apple support for PWAs is historically mixed, at best, and installing through **Apple Safari** is restricted to only the most recent versions of Safari/MacOS. Although native options for MacOS are more limited, it is still possible to install the program as a PWA through **Google Chrome** on MacOS (i.e., it can be pinned to the MenuBar to emulate native app behavior).

As a reminder, it is **not required** to 'install' DataTracker on your device to operate the program. The program can be accessed through your browser like any other website; However, installing the program on your device can provide a more 'native' experience and allows for quicker access to the program (e.g., added to Desktop/Menubar). The installation process is straightforward, and for most, is completed in just a few clicks. This is generally recommended, as once the program is installed, the app will automatically update as necessary.

Specific browsers each provide numerous pathways to install DataTracker. The simplest and most direct method would be to use the button provided on the site homepage. The button prompting install will be displayed whenever it is relevant and possible to install the program. It will not be displayed if you are visiting the site on a mobile device. A visual of the install button is shown below.

<div align="center" width="100%">
    <img src="/docs/install_button.png" alt="Image of install button"/>
</div>

The installation of the program completes in less than a second and is generally a seamless process. Once the program is installed, your computer will treat it similarly as it would any other program installed on the computer (e.g., would show up in Windows menu as an app). At this time, you may create a shortcut to the program on your desktop or pin it to your Taskbar/Dock for quick and easy access. Once clicked, it would open a window that looks like a traditional program, but is actually a web app running natively on your machine. Shown below is the DataTracker program pinned to the Task/Menu bar in Microsoft Windows.

<div align="center" width="100%">
    <img src="/docs/pin_taskbar.png" alt="Image of program pinned to task bar"/>
</div>

#### Installation for Windows Users

Support for PWA programs on Windows is quite good. Various options exist for installing PWAs on Windows, with most options generally being straightforward and consistent. The two most common browsers for Windows users are **Microsoft Edge** and **Google Chrome**. Both browsers provide native support for PWAs and are among the most widely used browsers on Windows machines.

##### Installation on Microsoft Edge (Recommended)

On a Windows machine, it is simplest to install DataTracker using **Microsoft Edge**. This is easiest for Windows users because Edge is included in the base operating system and there is no need to install any additional software (e.g., **Google Chrome**). Additionally, **Microsoft Edge** provides options in the installation process to automatically create desktop shortcuts and pin the program to the Task Bar.

Should you decide not to install using the button the home screen (the recommended option), you can install the program by clicking the 'Install' button that emerges in the browser bar. A visual of the native support provided via **Microsoft Edge** is shown below.

<div align="center" width="100%">
    <img src="/docs/edge_install.png" alt="Image of DataTracker install option on Edge"/>
</div>

##### Alternative Installation on Google Chrome

The installation of DataTracker on **Google Chrome** is also straightforward. This is largely the same process as with **Microsoft Edge**, but would require the installation of **Google Chrome** if you do not already have it on your machine. You can install the program by selecting the 'Install' button on the home screen, or alternatively, you can install the program manually by selecting the 'Install' option in the browser menu. A visual of the native support provided via **Google Chrome** is shown below.

<div align="center" width="100%">
    <img src="/docs/chrome_install.png" alt="Image of DataTracker install option on Chrome"/>
</div>

#### Installation for MacOS Users

There is a considerable base of SCED clinicians and researchers that use MacOS machines, and for the most part, all aspects of DataTracker are identical between operating systems (i.e., MacOS, Windows). However, there are some differences in the installation process for MacOS users, as the operating system is more restrictive in terms of PWA support. The most common browsers for MacOS users are **Apple Safari** and **Google Chrome**.

##### Installation on Google Chrome (Recommended)

Although native options for MacOS are possible, it is more universally supported to install DataTracker using **Google Chrome**. This is the most straightforward option for MacOS users, as it is among the most widely used browsers and is well-supported for PWA installations. You can install the program by selecting the 'Install' button on the home screen, or alternatively, you can install the program manually by selecting the 'Install' option in the browser menu. The process for doing so is identical to that on Windows machines.

##### Installation on Apple Safari

Installation on **Apple Safari** is only possible for those running the Sonoma build of MacOS. Additionally, this is not universally supported and may not be available in all regions. Should your machine meet the criteria for installation per Apple's standards, you would have to navigate to the DataTracker website and manually install the program as a PWA (i.e., File > "Add to Dock"). However, due to restrictions and limited support in MacOS, it is generally recommended to use **Google Chrome** for installation on MacOS at this time.
