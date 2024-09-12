import { KeySet } from "../../types/keyset";
import { v4 as uuidv4 } from "uuid";
import { createNewKeySet, deserializeKeySet, serializeKeySet } from "../keyset";

jest.mock("uuid", () => ({
  v4: jest.fn(),
}));

describe("KeySet Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createNewKeySet", () => {
    it("should create a new KeySet with the given name and generate a unique id", () => {
      const mockUUID = "123e4567-e89b-12d3-a456-426614174000";
      (uuidv4 as jest.Mock).mockReturnValue(mockUUID);

      const keySetName = "Test KeySet";
      const result = createNewKeySet(keySetName);

      expect(result.Name).toBe(keySetName);
      expect(result.FrequencyKeys).toEqual([]);
      expect(result.DurationKeys).toEqual([]);
      expect(result.id).toBe(mockUUID);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.lastModified).toBeInstanceOf(Date);
    });
  });

  describe("serializeKeySet", () => {
    it("should correctly serialize a KeySet", () => {
      const keySet: KeySet = {
        id: "test-id",
        Name: "Test KeySet",
        FrequencyKeys: [{ KeyName: "A", KeyDescription: "Key A", KeyCode: 65 }],
        DurationKeys: [{ KeyName: "D", KeyDescription: "Key D", KeyCode: 68 }],
        createdAt: new Date("2024-09-07T12:00:00Z"),
        lastModified: new Date("2024-09-07T13:00:00Z"),
      };

      const expectedSerialization = JSON.stringify({
        id: "test-id",
        Name: "Test KeySet",
        FrequencyKeys: [{ KeyName: "A", KeyDescription: "Key A", KeyCode: 65 }],
        DurationKeys: [{ KeyName: "D", KeyDescription: "Key D", KeyCode: 68 }],
        createdAt: "2024-09-07T12:00:00.000Z",
        lastModified: "2024-09-07T13:00:00.000Z",
      });

      const result = serializeKeySet(keySet);
      expect(result).toBe(expectedSerialization);
    });
  });

  describe("deserializeKeySet", () => {
    it("should correctly deserialize a KeySet from JSON", () => {
      const serializedKeySet = JSON.stringify({
        id: "test-id",
        Name: "Test KeySet",
        FrequencyKeys: [{ KeyName: "A", KeyDescription: "Key A", KeyCode: 65 }],
        DurationKeys: [{ KeyName: "D", KeyDescription: "Key D", KeyCode: 68 }],
        createdAt: "2024-09-07T12:00:00.000Z",
        lastModified: "2024-09-07T13:00:00.000Z",
      });

      const expectedKeySet: KeySet = {
        id: "test-id",
        Name: "Test KeySet",
        FrequencyKeys: [{ KeyName: "A", KeyDescription: "Key A", KeyCode: 65 }],
        DurationKeys: [{ KeyName: "D", KeyDescription: "Key D", KeyCode: 68 }],
        createdAt: new Date("2024-09-07T12:00:00Z"),
        lastModified: new Date("2024-09-07T13:00:00Z"),
      };

      const result = deserializeKeySet(serializedKeySet);
      expect(result).toEqual(expectedKeySet);
    });
  });
});
