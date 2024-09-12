import { KeySet } from "./keyset";

/**
 * Type for handling file read status
 */
export type LoadingStructure = {
  Status: "loading" | "complete" | "error";
  Error?: string;
  Values: string[];
};

/**
 * Type for handling keyset read status
 */
export type LoadingStructureKeysets = {
  Status: "loading" | "complete" | "error";
  Error?: string;
  KeySets: KeySet[];
};
