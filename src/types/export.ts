/**
 * Type for holding the key and value of an output instance
 */
export type EntryHolder = {
  Key: string;
  KeyCode: number;
  Value: string;
  Visible?: boolean;
};

/**
 * Type for holding the key and value of a *row* of outputs
 */
export type HumanReadableResultsRow = {
  Session: number;
  Date: Date;
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
  /**
   * The keys represent the different data points that are being tracked, such as "Session", "Date", "Condition", etc. Each key is associated with an array of `EntryHolder` objects, which contain the specific values for that key across different sessions or conditions. This structure allows for organized storage and retrieval of the tracked data, making it easier to analyze and visualize the results in a human-readable format.
   */
  keys: EntryHolder[];

  /**
   * The `type` property indicates the nature of the results being tracked, which can be either 'Frequency' or 'Duration'. This distinction is important for interpreting the data correctly, as it informs how the values in the `results` array should be understood and analyzed. For example, if the type is 'Frequency', the values may represent counts of occurrences, while if the type is 'Duration', the values may represent time intervals. This type information helps ensure that the data is used appropriately in any subsequent analysis or visualization.
   */
  type: 'Frequency' | 'Duration';

  /**
   * The `results` property is an array of `HumanReadableResultsRow` objects, where each object represents a specific session or condition with its associated data points. Each row contains information such as the session number, date, condition, data collector, therapist, and an array of values that correspond to the keys defined in the `keys` property. This structured format allows for easy access and manipulation of the results, enabling users to analyze trends, compare conditions, and draw insights from the collected data in a human-readable format.
   */
  results: HumanReadableResultsRow[];
};
