import { KeyManageType } from '@/types/timing';
import {
  BinValueType,
  KeyedReli,
  PreparedReliabilityData,
  ProbedKey,
  ReliabilityPairType,
  ScoredKey,
} from '@/types/reli';
import { SavedSessionResult } from './dtos';
import { KeySet } from '@/types/keyset';

/**
 * Generate an empty bin array
 *
 * @param n_bins number of bins
 * @returns bin array
 */
export function generateEmptyBinArray(n_bins: number) {
  return new Array(n_bins).fill(0).map((val, i) => {
    return {
      BinNumber: i,
      Value: val,
    };
  });
}

/**
 * Generates the exact index of agreement between two bin arrays
 *
 * @param Primary primary bin array
 * @param Reliability reliability bin array
 * @returns the exact index of agreement as a percentage
 */
export function generateEIABinMatch(Primary: BinValueType[], Reliability: BinValueType[]) {
  let ExactCountMatch = 0;
  const BinCounts = Primary.length;

  for (let i = 0; i < BinCounts; i++) {
    const primary_count = Math.floor(Primary[i].Value);
    const reli_count = Math.floor(Reliability[i].Value);

    if (primary_count === reli_count) {
      ExactCountMatch++;
    }
  }

  return (ExactCountMatch / BinCounts) * 100;
}

/**
 * Generates the average proportion of agreement between two bin arrays
 *
 * @param Primary primary bin array
 * @param Reliability reliability bin array
 * @returns the average proportion of agreement as a percentage
 */
export function generatePIABinMatch(Primary: BinValueType[], Reliability: BinValueType[]) {
  let running_proportions = 0.0;
  const BinCounts = Primary.length;

  for (let i = 0; i < BinCounts; i++) {
    const primary_count = Math.floor(Primary[i].Value);
    const reli_count = Math.floor(Reliability[i].Value);

    if (primary_count === reli_count) {
      running_proportions += 1;
    } else {
      running_proportions += Math.min(primary_count, reli_count) / Math.max(primary_count, reli_count);
    }
  }

  return (running_proportions / BinCounts) * 100;
}

/**
 * Generates the presence/absence agreement between two bin arrays
 *
 * @param Primary primary bin array
 * @param Reliability reliability bin array
 * @returns the presence/absence agreement as a percentage
 */
export function generateTIABinMatch(Primary: BinValueType[], Reliability: BinValueType[]) {
  let agreements = 0;
  const BinCounts = Primary.length;

  for (let i = 0; i < BinCounts; i++) {
    const primary_count = Math.floor(Primary[i].Value);
    const reli_count = Math.floor(Reliability[i].Value);

    if (primary_count === 0 && reli_count === 0) {
      agreements++;
    } else if (primary_count > 0 && reli_count > 0) {
      agreements++;
    }
  }

  return (agreements / BinCounts) * 100;
}

/**
 * Generates the presence/absence agreement between two bin arrays
 * with the condition that the bin is not empty
 *
 * @param Primary primary bin array
 * @param Reliability reliability bin array
 * @returns the presence/absence agreement for non-empty bins as a percentage
 */
export function generateOIABinMatch(Primary: BinValueType[], Reliability: BinValueType[]) {
  let observed_matches = 0;
  let observed_non_empty_intervals = 0;
  const BinCounts = Primary.length;

  for (let i = 0; i < BinCounts; i++) {
    const primary_count = Math.floor(Primary[i].Value);
    const reli_count = Math.floor(Reliability[i].Value);

    if (primary_count > 0 || reli_count > 0) {
      observed_non_empty_intervals++;

      // Note: Isn't this impossible?
      //if (primary_count === 0 && reli_count === 0) {
      //  observed_matches++;
      //} else
      if (primary_count > 0 && reli_count > 0) {
        observed_matches++;
      }
    }
  }

  return (observed_matches / observed_non_empty_intervals) * 100;
}

/**
 * Generates the presence/absence agreement between two bin arrays
 *
 * @param Primary primary bin array
 * @param Reliability reliability bin array
 * @returns the presence/absence agreement for non-empty bins as a percentage
 */
export function generateNIABinMatch(Primary: BinValueType[], Reliability: BinValueType[]) {
  let observed_matches = 0;
  let observed_non_empty_intervals = 0;
  const BinCounts = Primary.length;

  for (let i = 0; i < BinCounts; i++) {
    const primary_count = Math.floor(Primary[i].Value);
    const reli_count = Math.floor(Reliability[i].Value);

    observed_non_empty_intervals++;

    if (primary_count === 0 && reli_count === 0) {
      observed_matches++;
    } else if (primary_count > 0 && reli_count > 0) {
      observed_matches++;
    }
  }

  return (observed_matches / observed_non_empty_intervals) * 100;
}

/**
 * Generates the presence/absence agreement by minute
 *
 * @param Primary primary bin array
 * @param Reliability reliability bin array
 * @returns the presence/absence agreement by minute as a percentage
 */
export function generatePMABinMatch(Primary: BinValueType[], Reliability: BinValueType[]) {
  let minute = 0;
  let primary_temp = 0;
  let reliability_temp = 0;

  const BinCounts = Primary.length;

  let run_value = 0;

  for (let i = 0; i < BinCounts; i++) {
    const primary_count = Math.floor(Primary[i].Value);
    const reli_count = Math.floor(Reliability[i].Value);

    primary_temp += primary_count;
    reliability_temp += reli_count;

    if ((i + 1) % 6 === 0) {
      if (primary_temp === reliability_temp) {
        run_value += 1;
      } else {
        run_value += Math.min(primary_temp, reliability_temp) / Math.max(primary_temp, reliability_temp);
      }

      primary_temp = 0;
      reliability_temp = 0;

      minute++;
    }
  }

  return (run_value / minute) * 100;
}

/**
 * Adds a bin to the key data
 *
 * @param keyData Key data
 * @param binSize Bin size in seconds
 * @returns the key data with the added bin
 */
export function addBinToKeyData(keyData: KeyManageType, binSize = 10) {
  return {
    ...keyData,
    Bin: Math.floor(keyData.TimeIntoSession / binSize),
  };
}

/**
 * Get the corresponding session pairs
 *
 * @param Primary Primary sessions
 * @param Reliability Reliability sessions
 * @returns an array of reliability pairs with primary and reliability session results
 */
export function getCorrespondingSessionPairs(
  Primary: SavedSessionResult[],
  Reliability: SavedSessionResult[],
): ReliabilityPairType[] {
  const primary_with_reli = Primary.map((result) => {
    const reli = Reliability.find((reli) => reli.SessionSettings.Session === result.SessionSettings.Session);
    return { primary: result, reli };
  });

  return primary_with_reli.filter((pair) => pair.reli !== undefined) as ReliabilityPairType[];
}

/**
 * Pulls the relevant session numbers from a set of paired sessions for reliability calculations.
 *
 * @param pairedSessions An array of paired sessions used for reliability calculations
 * @returns An array of unique session numbers that are present in the paired sessions, sorted in ascending order
 */
export function pullRelevantSessions(pairedSessions: ReliabilityPairType[]) {
  return [
    ...new Set(
      pairedSessions.map((pair) => Number(pair.primary?.SessionSettings?.Session)).filter((n) => !Number.isNaN(n)),
    ),
  ].sort((a, b) => a - b);
}

/**
 * Calculate reliability for frequency keys
 *
 * @param pair Reliability pair
 * @param keys_to_code_f Keys to code
 * @returns an array of scored keys with reliability metrics for frequency keys
 */
export function calculateReliabilityFrequency(pair: ReliabilityPairType, keys_to_code_f: ProbedKey[]) {
  const { primary, reli } = pair;
  const keys: ScoredKey[] = [];

  keys_to_code_f.forEach((key) => {
    const binCounts = Math.round(primary.TimerMain / 10);

    // Note: You can't trust users to name accurately or copy keys accurately. Go by lower case and description
    const primary_relevant_key = primary.FrequencyKeyPresses.filter(
      (k) => k.KeyName.toLowerCase() === key.KeyName.toLowerCase(),
    ).map((k: KeyManageType) => addBinToKeyData(k));

    const reliability_relevant_key = reli.FrequencyKeyPresses.filter(
      (k) => k.KeyName.toLowerCase() === key.KeyName.toLowerCase(),
    ).map((k: KeyManageType) => addBinToKeyData(k));

    const key_bins_p = generateEmptyBinArray(binCounts);
    const key_bins_r = generateEmptyBinArray(binCounts);

    primary_relevant_key.forEach((k) => {
      key_bins_p[k.Bin].Value++;
    });

    reliability_relevant_key.forEach((k) => {
      if (k.Bin >= key_bins_r.length) {
        throw new Error(
          `Bin number ${k.Bin} is out of range for key ${k.KeyName} in session ${primary.SessionSettings.Session}. Please check the key data and binning logic.`,
        );
      }
      key_bins_r[k.Bin].Value++;
    });

    const EIA = generateEIABinMatch(key_bins_p, key_bins_r);
    const PIA = generatePIABinMatch(key_bins_p, key_bins_r);
    const TIA = generateTIABinMatch(key_bins_p, key_bins_r);
    const OIA = generateOIABinMatch(key_bins_p, key_bins_r);
    const NIA = generateNIABinMatch(key_bins_p, key_bins_r);
    const PMA = generatePMABinMatch(key_bins_p, key_bins_r);

    keys.push({
      Session: primary.SessionSettings.Session,
      KeyName: key.KeyName,
      KeyDescription: key.KeyDescription,
      EIA,
      PIA,
      TIA,
      OIA,
      NIA,
      PMA,
    });
  });

  return keys;
}

/**
 * Calculate reliability for duration keys
 *
 * @param pair Reliability pair
 * @param keys_to_code_d Keys to code
 * @returns an array of scored keys with reliability metrics for duration keys
 */
export function calculateReliabilityDuration(pair: ReliabilityPairType, keys_to_code_d: ProbedKey[]) {
  const { primary, reli } = pair;

  const keys: ScoredKey[] = [];

  keys_to_code_d.forEach((key) => {
    const binCounts = Math.round(primary.TimerMain / 10);

    // Note: Same as before, you can't trust users to name accurately or copy keys accurately. Go by lower case and description
    const primary_relevant_key = primary.DurationKeyPresses.filter(
      (k) => k.KeyName.toLowerCase() === key.KeyName.toLowerCase(),
    ).map((k: KeyManageType) => addBinToKeyData(k));

    const reliability_relevant_key = reli.DurationKeyPresses.filter(
      (k) => k.KeyName.toLowerCase() === key.KeyName.toLowerCase(),
    ).map((k: KeyManageType) => addBinToKeyData(k));

    const key_bins_p = generateEmptyBinArray(binCounts);
    const key_bins_r = generateEmptyBinArray(binCounts);

    const is_even_keys_p = primary_relevant_key.length % 2 === 0;

    if (is_even_keys_p) {
      for (let i = 0; i < primary_relevant_key.length; i += 2) {
        const point_a = primary_relevant_key[i];
        const point_b = primary_relevant_key[i + 1];

        for (let k = Math.floor(point_a.TimeIntoSession); k < Math.floor(point_b.TimeIntoSession); k++) {
          const bin = Math.floor(k / 10);
          key_bins_p[bin].Value++;
        }
      }
    } else {
      for (let i = 0; i < primary_relevant_key.length - 1; i += 2) {
        const point_a = primary_relevant_key[i];
        const point_b = primary_relevant_key[i + 1];

        for (let k = Math.floor(point_a.TimeIntoSession); k < Math.floor(point_b.TimeIntoSession); k++) {
          const bin = Math.floor(k / 10);
          key_bins_p[bin].Value++;
        }
      }

      for (
        let k = Math.floor(primary_relevant_key[primary_relevant_key.length - 1].TimeIntoSession);
        k < Math.floor(primary.TimerMain);
        k++
      ) {
        const bin = Math.floor(k / 10);
        key_bins_p[bin].Value++;
      }
    }

    const is_even_keys_r = reliability_relevant_key.length % 2 === 0;

    if (is_even_keys_r) {
      for (let i = 0; i < reliability_relevant_key.length; i += 2) {
        const point_a = reliability_relevant_key[i];
        const point_b = reliability_relevant_key[i + 1];

        for (let k = Math.floor(point_a.TimeIntoSession); k < Math.floor(point_b.TimeIntoSession); k++) {
          const bin = Math.floor(k / 10);
          key_bins_r[bin].Value++;
        }
      }
    } else {
      for (let i = 0; i < reliability_relevant_key.length - 1; i += 2) {
        const point_a = reliability_relevant_key[i];
        const point_b = reliability_relevant_key[i + 1];

        for (let k = Math.floor(point_a.TimeIntoSession); k < Math.floor(point_b.TimeIntoSession); k++) {
          const bin = Math.floor(k / 10);
          key_bins_r[bin].Value++;
        }
      }

      for (
        let k = Math.floor(reliability_relevant_key[reliability_relevant_key.length - 1].TimeIntoSession);
        k < Math.floor(primary.TimerMain);
        k++
      ) {
        const bin = Math.floor(k / 10);
        key_bins_r[bin].Value++;
      }
    }

    const EIA = generateEIABinMatch(key_bins_p, key_bins_r);
    const PIA = generatePIABinMatch(key_bins_p, key_bins_r);
    const TIA = generateTIABinMatch(key_bins_p, key_bins_r);
    const OIA = generateOIABinMatch(key_bins_p, key_bins_r);
    const NIA = generateNIABinMatch(key_bins_p, key_bins_r);
    const PMA = generatePMABinMatch(key_bins_p, key_bins_r);

    keys.push({
      Session: primary.SessionSettings.Session,
      KeyName: key.KeyName,
      KeyDescription: key.KeyDescription,
      EIA,
      PIA,
      TIA,
      OIA,
      NIA,
      PMA,
    });
  });

  return keys;
}

/**
 * Calculate reliability for duration keys
 *
 * @param pair Reliability pair
 * @param keys_to_code_d Keys to code
 * @returns an array of scored keys with reliability metrics for duration keys
 */
export function generateBinsProportion(primary: SavedSessionResult, keys_to_code_d: ProbedKey[]) {
  return keys_to_code_d.map((key) => {
    const binCounts = Math.round(primary.TimerMain / 10);

    const primary_relevant_key = primary.DurationKeyPresses.filter((k) => k.KeyDescription === key.KeyDescription).map(
      (k: KeyManageType) => addBinToKeyData(k),
    );

    const key_bins_p = generateEmptyBinArray(binCounts);

    const is_even_keys_p = primary_relevant_key.length % 2 === 0;

    if (is_even_keys_p) {
      for (let i = 0; i < primary_relevant_key.length; i += 2) {
        const point_a = primary_relevant_key[i];
        const point_b = primary_relevant_key[i + 1];

        for (let k = Math.floor(point_a.TimeIntoSession); k < Math.floor(point_b.TimeIntoSession); k++) {
          const bin = Math.floor(k / 10);
          key_bins_p[bin].Value++;
        }
      }
    } else {
      for (let i = 0; i < primary_relevant_key.length - 1; i += 2) {
        const point_a = primary_relevant_key[i];
        const point_b = primary_relevant_key[i + 1];

        for (let k = Math.floor(point_a.TimeIntoSession); k < Math.floor(point_b.TimeIntoSession); k++) {
          const bin = Math.floor(k / 10);
          key_bins_p[bin].Value++;
        }
      }

      for (
        let k = Math.floor(primary_relevant_key[primary_relevant_key.length - 1].TimeIntoSession);
        k < Math.floor(primary.TimerMain);
        k++
      ) {
        const bin = Math.floor(k / 10);
        key_bins_p[bin].Value++;
      }
    }

    const TotalBins = key_bins_p.length;
    const BinsNonzero = key_bins_p.filter((bin) => bin.Value > 0).length;
    const Proportion = (BinsNonzero / TotalBins) * 100;

    return {
      ...key,
      TotalBins,
      BinsNonzero,
      Proportion,
    };
  });
}

export function prepareFrequencyReliTable(paired: ReliabilityPairType[], keyset: KeySet): PreparedReliabilityData {
  const sessions = pullRelevantSessions(paired);
  const sessions_scored_frequency = paired.map((pair) => calculateReliabilityFrequency(pair, keyset.FrequencyKeys));

  const headings = keyset.FrequencyKeys.flatMap((key) => {
    return [
      `${key.KeyDescription} (EIA)`,
      `${key.KeyDescription} (PIA)`,
      `${key.KeyDescription} (TIA)`,
      `${key.KeyDescription} (OIA)`,
      `${key.KeyDescription} (NIA)`,
      `${key.KeyDescription} (PMA)`,
    ];
  });
  headings.unshift('Session #');

  const EIA_values: KeyedReli[] = [];
  const PIA_values: KeyedReli[] = [];
  const TIA_values: KeyedReli[] = [];
  const OIA_values: KeyedReli[] = [];
  const NIA_values: KeyedReli[] = [];
  const PMA_values: KeyedReli[] = [];

  const rows = sessions.map((session) => {
    const temp_array = [{ value: session.toString(), readOnly: true }];

    keyset.FrequencyKeys.forEach((key) => {
      const session_to_show = sessions_scored_frequency
        .flat()
        .find((s) => s.Session === session && s.KeyName === key.KeyName);

      if (!session_to_show) {
        temp_array.push({ value: '', readOnly: true });
        temp_array.push({ value: '', readOnly: true });
        temp_array.push({ value: '', readOnly: true });
        temp_array.push({ value: '', readOnly: true });
        temp_array.push({ value: '', readOnly: true });
        temp_array.push({ value: '', readOnly: true });
        return;
      }

      const { EIA, PIA, TIA, OIA, NIA, PMA } = session_to_show;

      EIA_values.push({ Value: EIA, KeyName: key.KeyName });
      PIA_values.push({ Value: PIA, KeyName: key.KeyName });
      TIA_values.push({ Value: TIA, KeyName: key.KeyName });
      OIA_values.push({ Value: OIA, KeyName: key.KeyName });
      NIA_values.push({ Value: NIA, KeyName: key.KeyName });
      PMA_values.push({ Value: PMA, KeyName: key.KeyName });

      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      (temp_array.push({
        value: EIA.toFixed(2),
        readOnly: true,
      }),
        temp_array.push({
          value: PIA.toFixed(2),
          readOnly: true,
        }),
        temp_array.push({
          value: TIA.toFixed(2),
          readOnly: true,
        }),
        temp_array.push({
          value: OIA.toFixed(2),
          readOnly: true,
        }),
        temp_array.push({
          value: NIA.toFixed(2),
          readOnly: true,
        }),
        temp_array.push({
          value: PMA.toFixed(2),
          readOnly: true,
        }));
    });

    return temp_array;
  });

  // Calculate mean row
  const mean_row = [{ value: 'Averaged', readOnly: true }];

  keyset.FrequencyKeys.forEach((key) => {
    const relevantEIA_values = EIA_values.filter((k) => k.KeyName == key.KeyName && !Number.isNaN(k.Value)).map(
      (k) => k.Value,
    );
    const relevantPIA_values = PIA_values.filter((k) => k.KeyName == key.KeyName && !Number.isNaN(k.Value)).map(
      (k) => k.Value,
    );
    const relevantTIA_values = TIA_values.filter((k) => k.KeyName == key.KeyName && !Number.isNaN(k.Value)).map(
      (k) => k.Value,
    );
    const relevantOIA_values = OIA_values.filter((k) => k.KeyName == key.KeyName && !Number.isNaN(k.Value)).map(
      (k) => k.Value,
    );
    const relevantNIA_values = NIA_values.filter((k) => k.KeyName == key.KeyName && !Number.isNaN(k.Value)).map(
      (k) => k.Value,
    );
    const relevantPMA_values = PMA_values.filter((k) => k.KeyName == key.KeyName && !Number.isNaN(k.Value)).map(
      (k) => k.Value,
    );

    mean_row.push({
      value: (relevantEIA_values.reduce((a, b) => a + b, 0) / relevantEIA_values.length).toFixed(2),
      readOnly: true,
    });

    mean_row.push({
      value: (relevantPIA_values.reduce((a, b) => a + b, 0) / relevantPIA_values.length).toFixed(2),
      readOnly: true,
    });

    mean_row.push({
      value: (relevantTIA_values.reduce((a, b) => a + b, 0) / relevantTIA_values.length).toFixed(2),
      readOnly: true,
    });

    mean_row.push({
      value: (relevantOIA_values.reduce((a, b) => a + b, 0) / relevantOIA_values.length).toFixed(2),
      readOnly: true,
    });

    mean_row.push({
      value: (relevantNIA_values.reduce((a, b) => a + b, 0) / relevantNIA_values.length).toFixed(2),
      readOnly: true,
    });

    mean_row.push({
      value: (relevantPMA_values.reduce((a, b) => a + b, 0) / relevantPMA_values.length).toFixed(2),
      readOnly: true,
    });
  });

  rows.push(mean_row);

  return { headings, rows };
}

export function prepareDurationReliTable(paired: ReliabilityPairType[], keyset: KeySet): PreparedReliabilityData {
  const sessions = pullRelevantSessions(paired);
  const sessions_scored_duration = paired.map((pair) => calculateReliabilityDuration(pair, keyset.DurationKeys));

  const headings = keyset.DurationKeys.flatMap((key) => {
    return [
      `${key.KeyDescription} (EIA)`,
      `${key.KeyDescription} (PIA)`,
      `${key.KeyDescription} (TIA)`,
      `${key.KeyDescription} (OIA)`,
      `${key.KeyDescription} (NIA)`,
      `${key.KeyDescription} (PMA)`,
    ];
  });
  headings.unshift('Session #');

  const EIA_values: KeyedReli[] = [];
  const PIA_values: KeyedReli[] = [];
  const TIA_values: KeyedReli[] = [];
  const OIA_values: KeyedReli[] = [];
  const NIA_values: KeyedReli[] = [];
  const PMA_values: KeyedReli[] = [];

  const rows = sessions.map((session) => {
    const temp_array = [{ value: session.toString(), readOnly: true }];

    keyset.DurationKeys.forEach((key) => {
      const session_to_show = sessions_scored_duration
        .flat()
        .find((s) => s.Session === session && s.KeyName === key.KeyName);

      if (!session_to_show) {
        temp_array.push({ value: '', readOnly: true });
        temp_array.push({ value: '', readOnly: true });
        temp_array.push({ value: '', readOnly: true });
        temp_array.push({ value: '', readOnly: true });
        temp_array.push({ value: '', readOnly: true });
        temp_array.push({ value: '', readOnly: true });
        return;
      }

      const { EIA, PIA, TIA, OIA, NIA, PMA } = session_to_show;

      EIA_values.push({ KeyName: key.KeyName, Value: EIA });
      PIA_values.push({ KeyName: key.KeyName, Value: PIA });
      TIA_values.push({ KeyName: key.KeyName, Value: TIA });
      OIA_values.push({ KeyName: key.KeyName, Value: OIA });
      NIA_values.push({ KeyName: key.KeyName, Value: NIA });
      PMA_values.push({ KeyName: key.KeyName, Value: PMA });

      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      (temp_array.push({
        value: EIA.toFixed(2),
        readOnly: true,
      }),
        temp_array.push({
          value: PIA.toFixed(2),
          readOnly: true,
        }),
        temp_array.push({
          value: TIA.toFixed(2),
          readOnly: true,
        }),
        temp_array.push({
          value: OIA.toFixed(2),
          readOnly: true,
        }),
        temp_array.push({
          value: NIA.toFixed(2),
          readOnly: true,
        }),
        temp_array.push({
          value: PMA.toFixed(2),
          readOnly: true,
        }));
    });

    return temp_array;
  });

  // Calculate mean row
  const mean_row = [{ value: 'Averaged', readOnly: true }];

  keyset.DurationKeys.forEach((key) => {
    const relevantEIA_values = EIA_values.filter((k) => k.KeyName == key.KeyName && !Number.isNaN(k.Value)).map(
      (k) => k.Value,
    );
    const relevantPIA_values = PIA_values.filter((k) => k.KeyName == key.KeyName && !Number.isNaN(k.Value)).map(
      (k) => k.Value,
    );
    const relevantTIA_values = TIA_values.filter((k) => k.KeyName == key.KeyName && !Number.isNaN(k.Value)).map(
      (k) => k.Value,
    );
    const relevantOIA_values = OIA_values.filter((k) => k.KeyName == key.KeyName && !Number.isNaN(k.Value)).map(
      (k) => k.Value,
    );
    const relevantNIA_values = NIA_values.filter((k) => k.KeyName == key.KeyName && !Number.isNaN(k.Value)).map(
      (k) => k.Value,
    );
    const relevantPMA_values = PMA_values.filter((k) => k.KeyName == key.KeyName && !Number.isNaN(k.Value)).map(
      (k) => k.Value,
    );

    mean_row.push({
      value: (relevantEIA_values.reduce((a, b) => a + b, 0) / relevantEIA_values.length).toFixed(2),
      readOnly: true,
    });

    mean_row.push({
      value: (relevantPIA_values.reduce((a, b) => a + b, 0) / relevantPIA_values.length).toFixed(2),
      readOnly: true,
    });

    mean_row.push({
      value: (relevantTIA_values.reduce((a, b) => a + b, 0) / relevantTIA_values.length).toFixed(2),
      readOnly: true,
    });

    mean_row.push({
      value: (relevantOIA_values.reduce((a, b) => a + b, 0) / relevantOIA_values.length).toFixed(2),
      readOnly: true,
    });

    mean_row.push({
      value: (relevantNIA_values.reduce((a, b) => a + b, 0) / relevantNIA_values.length).toFixed(2),
      readOnly: true,
    });

    mean_row.push({
      value: (relevantPMA_values.reduce((a, b) => a + b, 0) / relevantPMA_values.length).toFixed(2),
      readOnly: true,
    });
  });

  rows.push(mean_row);

  return { headings, rows };
}

