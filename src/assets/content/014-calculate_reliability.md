---
title: Reviewing Interobserver Agreement for Specific Evaluation Data
description: This documentation entry provides an overview of the process of calculating inter-rater reliability for specific evaluation data in DataTracker, including the purpose, methods, and types of agreement calculations available.
date: 09/27/2024
keywords: 'Data Collection, Interobserver Agreement, Data Export'
author: 'Shawn Gilroy'
---

The DataTracker program makes it easy to calculate several forms of Inter Observer Agreement (IOA). This is a measure of the agreement between two or more raters. The program can calculate several forms of agreement. As a general default, agreement is estimated using 10s bins of data recorded in real time through the session. This entry first provides an overview of the _types_ of IOA supported followed by a description of _how_ the software proceeds with determining agreement between raters.

### Dimensions of Agreement Scored/Computed

The DataTracker program is designed to support many forms of IOA customary in clinical and research applications. As a general default, these are calculated within 'binned' counts contained in 10s intervals (e.g., seconds of a behavior, counts of a behavior) that are compared across raters (i.e., a Primary and Reliability data collector). A short description of each of the supplied metrics is provided below.

#### Exact Interval Agreement (EIA)

The EIA is the percentage of intervals in which the raters agree on the exact same behavior. This is the most stringent form of agreement. It is calculated as follows:

```
EIA = (Number of Matching Intervals / Total Number of Intervals) * 100
```

For example, if two raters agreement closely across intervals, but only _exactly_ matched in 1/2 of those instances, the EIA would be 50%.

#### Partial Interval Agreement (PIA)

The PIA is the percentage of intervals in which the raters agree on the presence of the behavior. This is a less stringent form of agreement. It is calculated by _averaging_ the percentage of intervals in which the raters agree on the presence of the behavior. It is calculated by dividing the lower of the two values by the higher of the two values and multiplying. This is done for each bin and then averaged across all 10s bins.

```
PIA[n] = (min(Value) / max(Value))

PIA = mean(PIA) \* 100
```

Whereas the EIA indicates 'strict' agreement, which may be difficult to achieve in high-rate circumstances (e.g., 29 vs 30 instances in a 10s block), the PIA would reflect a 97% match rather than a 0% match for the 10s interval.

#### Total Interval Agreement (TIA)

The TIA is another more permissive IOA metric. The TIA reflects agreement on the _presence_ and _absence_ of target behavior. Specifically, it reflects agreement on whether _some_ degree of behavior did or did not occur.

```
TIA = (Bins with Agreement something did or didn't occur / Total Number of Bins) * 100
```

The TIA is somewhat more permissive than the PIA and may be a better fit for behavior where this is a need to agree that it did or didn't occur rather than agree on some specific dimension of that behavior (e.g., specific seconds measured, instances recorded).

#### Occurrence Interval Agreement (OIA)

The OIA is related to the TIA, but specific to agreement on the _presence_ of some target behavior. That is, it reflects the percentage of agreement where raters match on the _presence_ of behavior.

```
OIA = (Bins with Agreement / Total Number of Bins) * 100
```

The OIA warrants considerations like the TIA.

#### Non-occurrence Interval Agreement (NIA)

The NIA is related to the TIA, but specific to agreement on the _absence_ of some target behavior. That is, it reflects the percentage of agreement where raters match on the _absence_ of behavior. It is essentially the _inverse_ of OIA.

```
NIA = (Bins with Agreement / Total Number of Bins) * 100
```

The OIA warrants considerations like the TIA.

#### Responses per Minute Agreement (RPMA)

Finally, the RPMA is the number of responses per minute that the raters agree on. Said more simply, this calculation focuses on a sequence of six 10s interval bins rather than one, which may be more valid when rapid behavior onset and offset introduces challenges to consistent recording.

```
RPMA = (60s Bins with Agreement / Total Number of 60s Bins) * 100
```

### Calculating IOA with DataTracker

All interactions with DataTracker are limited to a single data collector operating the software at a given time. That is, data collection generally takes place using _two_ data collectors recording behavior in real-time (e.g., a Primary and Reliability data collector starting/stopping at the same time). Before any calculations of IOA can be performed, the complete set of data (i.e., Primary and Reliability data for a given session) must be available on the machine.

The DataTracker software can only calculate IOA when the necessary data is contained in the _relevant 'DataTracker' folder_. In the past, many have opted to directly copy-paste files directly from one computer to another (e.g., via some intranet storage). This remains an option for users versed in the software (and comfortable with associated risks), but the DataTracker software provides an option to identify a _second_ 'DataTracker' folder from which to push/pull files (e.g., a shared network folder).

The built-in 'sync' functionality is recommended for most users and this is presented in the following section in greater detail. As a reminder, _no IOA can be computed until the required files are available on the current machine_. When corresponding pairs of session data are available, the software will compute _all_ IOA metrics without further input from the user.
