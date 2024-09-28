---
title: Reviewing Rater Reliability for Specific Evaluation Data
date: 09/27/2024
keywords: 'Rater Reliability Inspection, Data Export'
author: 'Shawn Gilroy'
index: 10
---

The DataTracker program makes it easy to calculated several forms of Interrater Reliability. This is a measure of the agreement between two or more raters. The program can calculate several forms of agreement. As a general default, agreement is estimated using 10s bins of data recorded in real time through the session.

### Exact Interval Agreement (EIA)

The EIA is the percentage of intervals in which the raters agree on the exact same behavior. This is the most stringent form of agreement. It is calculated as follows:

```
EIA = (Number of Matching Intervals / Total Number of Intervals) * 100
```

### Partial Interval Agreement (PIA)

The PIA is the percentage of intervals in which the raters agree on the presence of the behavior. This is a less stringent form of agreement. It is calculated by _averaging_ the percentage of intervals in which the raters agree on the presence of the behavior. It is calculated by dividing the lower of the two values by the higher of the two values and multiplying. This is done for each bin and then averaged across all 10s bins.

```
PIA[n] = (min(Value) / max(Value))

PIA = mean(PIA) \* 100
```

### Total Interval Agreement (TIA)

The TIA is the percentage of intervals in which the raters agree on either the presence of _some_ behavior or the _absence_ of behavior.

```
TIA = (Bins with Agreement / Total Number of Bins) * 100
```

### Occurrence Interval Agreement (OIA)

The OIA is the percentage of intervals in which the raters agree on the _presence_ of behavior. In most ways, it is much like the TIA but specific to intervals with _some_ behavior.

```
OIA = (Bins with Agreement / Total Number of Bins) * 100
```

### Non-occurrence Interval Agreement (NIA)

The NIA is the percentage of intervals in which the raters agree on the _absence_ of behavior. It is essentially the _inverse_ of OIA.

```
NIA = (Bins with Agreement / Total Number of Bins) * 100
```

### Responses per Minute Agreement (RPMA)

The RPMA is the number of responses per minute that the raters agree on. In essence, it functions like a 60s bin scoring rather than a 10s bin scoring. In this fashion, it is largely like EIA.

```
RPMA = (60s Bins with Agreement / Total Number of 60s Bins) * 100
```
