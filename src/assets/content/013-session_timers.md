---
title: Session Timers, Pausing/Terminating Sessions
description: This document provides an overview of how session time is recorded, managed, and integrated into calculations of rate. This information has substantial bearing on how individual sessions are designed and implemented.
date: 05/16/2025
keywords: 'Session Designer, Session Conditions, Data Collection'
author: 'Shawn Gilroy'
---

Session times are a critical element of clinical and research protocols. In DataTracker, there are numerous 'Timers' which have pragmatic (e.g., when the session should conclude) and quantitative implications (e.g., rate when on Timer #1 vs. rate when on Timer #2). These are discussed and referenced below along with common use cases for including multiple timers.

### Timers and Session Design

There are a total of _four_ distinct times tracked in the software. Specifically, there is a primary (#1), a secondary (#2), a tertiary (#3), and a total over timer (i.e., a sum of _all_ active timers). Virtually all sessions will prioritize the primary timer (#1); however, there are certain instances when sessions should be designed around a _certain_ timer.

#### Example 1. 'Simple' Timing (e.g., Functional Analysis)

The simplest session arrangement would be based on just a _single_ timer (e.g., Timer #1 [Primary]). For example, in a function analysis, session conditions correspond with a fixed session duration that is scored uniformly (i.e., a single, fixed duration). In such circumstances, the session designer should be set to end on "Timer #1 Time" for the respective duration (e.g., 600 seconds).

Although ending on "Total Time" and "Timer #1 Time" are essentially synonymous if using a single timer, ending on "Timer #1 Time" is suggested in these circumstances because switching to a "Timer #2" during session facilitates a "pausing" of the "Timer #1" duration. For this reason, "End on Timer #1" remains the default rather than "End on Total Time."

When in doubt, it is recommended to end session based on "Timer #1" so that either Timer #s 2 or 3 can be used as a 'Pause' timer in the software.

#### Example 2. 'Comparative' Timing (e.g., multiple schedules)

It is often helpful to compare responding across contexts that may take place at certain times during a session. In the case of multiple schedules, clinicians may wish to examine rates of individual behavior when in the presence (i.e., availability of reinforcement; Timer #1) and the absence of stimuli signaling the availability of programmed reinforcement (i.e., non-availability of reinforcement; Timer #2).

In this arrangement, both Timer #1 and Timer #2 would count toward a _shared_ session limit (e.g., 600s), with each contributing toward that _total_ session duration. The criteria for ending this type of session would require the "End on Total Time" setting, since the procedure would entail some varying amounts of Timer #1/#2 time but an overall common total session duration.

The DataTracker software supports comparative timing situations in a few ways. First, if the ability to 'pause' isn't especially critical, it would be easiest to maintain the 'End on Total Time' setting to maintain the uniform session length. Alternatively, if there is a goal of maintaining a 'pause' timer that does not count toward the final calculations, it may be simpler to base the session termination criteria on Timer #1 (e.g., 30s S-delta from 600s = 570s ending for Timer #1). This has the benefit of maintaining the ability to record and quantify behavior on each of the three schedules provided (e.g., calculations of rate, proportion of session).

#### Other Notes

The DataTracker software supports a total of _three_ timers to provide flexibility with how sessions are designed and quantified. Users are suggested to design these session parameters carefully in order to best align the software with their intended goals/questions.
