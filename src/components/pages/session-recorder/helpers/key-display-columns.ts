import { KeySet, KeySetInstance } from "@/types/keyset";
import { ScreenSizingTypes } from "@/types/settings";

const MIN_KEY_COUNT_FOR_SPLIT_TWO_COL = 6;

const MIN_KEY_COUNT_FOR_SPLIT_THREE_COL = 12;

function* chunking<T>(arr: T[], n: number): Generator<T[], void> {
  for (let i = 0; i < arr.length; i += n) {
    yield arr.slice(i, i + n);
  }
}

export function generateChunkedVisuals(
  Keyset: KeySet,
  FrequencyKeys: KeySetInstance[],
  DurationKeys: KeySetInstance[],
  isDense: boolean,
  displaySize: ScreenSizingTypes,
): {
  TablesF: number;
  TablesD: number;
  FrequencyKeyChunks: KeySetInstance[][];
  DurationKeyChunks: KeySetInstance[][];
} {
  /** Return all */
  if (isDense === false) {
    return {
      TablesF: 1,
      TablesD: 1,
      FrequencyKeyChunks: [FrequencyKeys],
      DurationKeyChunks: [DurationKeys],
    };
  }

  const nCols = isDense && displaySize !== 'extra-wide' ? 2 : 3;
  let nColsF = nCols;

  if (FrequencyKeys.length < MIN_KEY_COUNT_FOR_SPLIT_TWO_COL) {
    nColsF = 1;
  } else if (FrequencyKeys.length < MIN_KEY_COUNT_FOR_SPLIT_THREE_COL) {
    nColsF = 2;
  }

  let nColsD = nCols;

  if (DurationKeys.length < MIN_KEY_COUNT_FOR_SPLIT_TWO_COL) {
    nColsD = 1;
  } else if (DurationKeys.length < MIN_KEY_COUNT_FOR_SPLIT_THREE_COL) {
    nColsD = 2;
  }

  const freqChunks = Math.ceil(FrequencyKeys.length / nColsF);
  const durChunks = Math.ceil(DurationKeys.length / nColsD);

  return {
    TablesF: nColsF,
    TablesD: nColsD,
    FrequencyKeyChunks: [...chunking(Keyset.FrequencyKeys, freqChunks)],
    DurationKeyChunks: [...chunking(Keyset.DurationKeys, durChunks)],
  };
}
