import { exportHumanReadableToCSV } from "../download";
import { HumanReadableResults } from "../../types/export";

describe("exportHumanReadableToCSV", () => {
  it("should generate a CSV string with the correct header and data rows", () => {
    const input: HumanReadableResults = {
      keys: [
        { Key: "key1", Value: "Behavior1" },
        { Key: "key2", Value: "Behavior2" },
      ],
      type: "Frequency",
      results: [
        {
          Session: 1,
          Condition: "Condition1",
          DataCollector: "Collector1",
          Therapist: "Therapist1",
          values: [
            { Key: "key1", Value: "5" },
            { Key: "key2", Value: "10" },
          ],
          duration: 30,
          Timer1: 10,
          Timer2: 20,
          Timer3: 30,
        },
      ],
    };

    const expectedCSV = [
      "Session #,Condition,Data Collector,Therapist,Behavior1 (Count),Behavior1 (Rate),Behavior2 (Count),Behavior2 (Rate),Session Duration (Minutes)",
      "1,Condition1,Collector1,Therapist1,5,10,30",
    ].join("\r\n");

    const result = exportHumanReadableToCSV(input);
    expect(result).toBe(expectedCSV);
  });

  it("should handle empty results array and return just the header", () => {
    const input: HumanReadableResults = {
      keys: [{ Key: "key1", Value: "Behavior1" }],
      type: "Duration",
      results: [],
    };

    const expectedCSV = [
      "Session #,Condition,Data Collector,Therapist,Behavior1 (Count),Behavior1 (Rate),Session Duration (Minutes)",
    ].join("\r\n");

    const result = exportHumanReadableToCSV(input);
    expect(result).toBe(expectedCSV);
  });

  it("should correctly handle multiple rows in the results", () => {
    const input: HumanReadableResults = {
      keys: [{ Key: "key1", Value: "Behavior1" }],
      type: "Frequency",
      results: [
        {
          Session: 1,
          Condition: "Condition1",
          DataCollector: "Collector1",
          Therapist: "Therapist1",
          values: [{ Key: "key1", Value: "5" }],
          duration: 30,
          Timer1: 10,
          Timer2: 20,
          Timer3: 30,
        },
        {
          Session: 2,
          Condition: "Condition2",
          DataCollector: "Collector2",
          Therapist: "Therapist2",
          values: [{ Key: "key1", Value: "7" }],
          duration: 45,
          Timer1: 15,
          Timer2: 25,
          Timer3: 35,
        },
      ],
    };

    const expectedCSV = [
      "Session #,Condition,Data Collector,Therapist,Behavior1 (Count),Behavior1 (Rate),Session Duration (Minutes)",
      "1,Condition1,Collector1,Therapist1,5,30",
      "2,Condition2,Collector2,Therapist2,7,45",
    ].join("\r\n");

    const result = exportHumanReadableToCSV(input);
    expect(result).toBe(expectedCSV);
  });

  it("should correctly escape commas in data fields", () => {
    const input: HumanReadableResults = {
      keys: [{ Key: "key1", Value: "Behavior1" }],
      type: "Frequency",
      results: [
        {
          Session: 1,
          Condition: "Condition,1",
          DataCollector: "Collector,1",
          Therapist: "Therapist,1",
          values: [{ Key: "key1", Value: "5,000" }],
          duration: 30,
          Timer1: 10,
          Timer2: 20,
          Timer3: 30,
        },
      ],
    };

    const expectedCSV = [
      "Session #,Condition,Data Collector,Therapist,Behavior1 (Count),Behavior1 (Rate),Session Duration (Minutes)",
      "1,Condition1,Collector1,Therapist1,5000,30",
    ].join("\r\n");

    const result = exportHumanReadableToCSV(input);
    expect(result).toBe(expectedCSV);
  });

  it("should handle cases where the keys array is empty", () => {
    const input: HumanReadableResults = {
      keys: [],
      type: "Duration",
      results: [
        {
          Session: 1,
          Condition: "Condition1",
          DataCollector: "Collector1",
          Therapist: "Therapist1",
          values: [],
          duration: 30,
          Timer1: 10,
          Timer2: 20,
          Timer3: 30,
        },
      ],
    };

    const expectedCSV = [
      "Session #,Condition,Data Collector,Therapist,Session Duration (Minutes)",
      "1,Condition1,Collector1,Therapist1,30",
    ].join("\r\n");

    const result = exportHumanReadableToCSV(input);
    expect(result).toBe(expectedCSV);
  });
});
