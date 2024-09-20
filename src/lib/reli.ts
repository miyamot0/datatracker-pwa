import { KeyManageType } from '@/components/pages/session-recorder/types/session-recorder-types';
import { BinValueType, ProbedKey, ReliabilityPairType, ScoredKey } from '@/types/reli';
import { SavedSessionResult } from './dtos';

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
 * @returns
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
 * @returns
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
 * @returns
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
 * @returns
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

      if (primary_count === 0 && reli_count === 0) {
        observed_matches++;
      } else if (primary_count > 0 && reli_count > 0) {
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
 * @returns
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
 * @returns
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
 * @returns
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
 * @returns
 */
export function getCorrespondingSessionPairs(
  Primary: SavedSessionResult[],
  Reliability: SavedSessionResult[]
): ReliabilityPairType[] {
  const primary_with_reli = Primary.map((result) => {
    const reli = Reliability.find((reli) => reli.SessionSettings.Session === result.SessionSettings.Session);
    return { primary: result, reli };
  });

  return primary_with_reli.filter((pair) => pair.reli !== undefined) as ReliabilityPairType[];
}

/**
 * Calculate reliability for frequency keys
 *
 * @param pair Reliability pair
 * @param keys_to_code_f Keys to code
 * @returns
 */
export function calculateReliabilityFrequency(pair: ReliabilityPairType, keys_to_code_f: ProbedKey[]) {
  const { primary, reli } = pair;

  const keys: ScoredKey[] = [];

  keys_to_code_f.forEach((key) => {
    const binCounts = Math.round(primary.TimerMain / 10);

    const primary_relevant_key = primary.FrequencyKeyPresses.filter((k) => k.KeyDescription === key.KeyDescription).map(
      (k: KeyManageType) => addBinToKeyData(k)
    );

    const reliability_relevant_key = reli.FrequencyKeyPresses.filter(
      (k) => k.KeyDescription === key.KeyDescription
    ).map((k: KeyManageType) => addBinToKeyData(k));

    const key_bins_p = generateEmptyBinArray(binCounts);
    primary_relevant_key.forEach((k) => {
      key_bins_p[k.Bin].Value++;
    });

    const key_bins_r = generateEmptyBinArray(binCounts);
    reliability_relevant_key.forEach((k) => {
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
 * @returns
 */
export function calculateReliabilityDuration(pair: ReliabilityPairType, keys_to_code_d: ProbedKey[]) {
  const { primary, reli } = pair;

  const keys: ScoredKey[] = [];

  keys_to_code_d.forEach((key) => {
    const binCounts = Math.round(primary.TimerMain / 10);

    const primary_relevant_key = primary.DurationKeyPresses.filter((k) => k.KeyDescription === key.KeyDescription).map(
      (k: KeyManageType) => addBinToKeyData(k)
    );

    const reliability_relevant_key = reli.DurationKeyPresses.filter((k) => k.KeyDescription === key.KeyDescription).map(
      (k: KeyManageType) => addBinToKeyData(k)
    );

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
 * @returns
 */
export function generateBinsProportion(primary: SavedSessionResult, keys_to_code_d: ProbedKey[]) {
  return keys_to_code_d.map((key) => {
    const binCounts = Math.round(primary.TimerMain / 10);

    const primary_relevant_key = primary.DurationKeyPresses.filter((k) => k.KeyDescription === key.KeyDescription).map(
      (k: KeyManageType) => addBinToKeyData(k)
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
