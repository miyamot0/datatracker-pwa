/**
 * Type for holding the key and value of an output instance
 */
export type EntryHolder = {
  Key: string;
  Value: string;
};

/**
 * Type for holding the key and value of a *row* of outputs
 */
export type HumanReadableResultsRow = {
  Session: number;
  Condition: string;
  DataCollector: string;
  Therapist: string;
  values: EntryHolder[];
  duration: number;

  Timer1: number;
  Timer2: number;
  Timer3: number;
};

/**
 * Type for holding the keys and results of the human readable results
 */
export type HumanReadableResults = {
  keys: EntryHolder[];
  type: "Frequency" | "Duration";
  results: HumanReadableResultsRow[];
};
