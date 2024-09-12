import { DEFAULT_SESSION_SETTINGS } from "../dtos";
import {
  getGroupFolders,
  GetHandleEvaluationFolder,
  GetHandleKeyboardsFolder,
  GetSettingsFileFromEvaluationFolder,
  pullSessionSettings,
  removeGroupFolder,
} from "../files";

describe("GetHandleEvaluationFolder", () => {
  let mockHandle: any;

  beforeEach(() => {
    mockHandle = {
      getDirectoryHandle: jest.fn().mockResolvedValue({
        getDirectoryHandle: jest.fn().mockResolvedValue({
          getDirectoryHandle: jest.fn().mockResolvedValue({}),
        }),
      }),
    };
  });

  it("should create and return the evaluation folder handle", async () => {
    const group = "Group1";
    const individual = "Individual1";
    const evaluation = "Evaluation1";

    const result = await GetHandleEvaluationFolder(
      mockHandle,
      group,
      individual,
      evaluation
    );

    expect(mockHandle.getDirectoryHandle).toHaveBeenCalledWith(group, {
      create: true,
    });
    expect(result).toBeDefined();
  });
});

describe("GetHandleKeyboardsFolder", () => {
  let mockHandle: any;

  beforeEach(() => {
    mockHandle = {
      getDirectoryHandle: jest.fn().mockResolvedValue({
        getDirectoryHandle: jest.fn().mockResolvedValue({}),
      }),
    };
  });

  it.skip("should create and return the keyboards folder handle", async () => {
    const group = "Group1";
    const individual = "Individual1";

    const result = await GetHandleKeyboardsFolder(
      mockHandle,
      group,
      individual
    );

    expect(mockHandle.getDirectoryHandle).toHaveBeenCalledWith(group, {
      create: true,
    });
    expect(result).toThrow();
  });
});

describe("GetSettingsFileFromEvaluationFolder", () => {
  let mockFilesHandle: any;
  const mockSettingsJson = { some: "settings" };

  beforeEach(() => {
    mockFilesHandle = {
      getFileHandle: jest.fn().mockResolvedValue({
        getFile: jest.fn().mockResolvedValue({
          text: jest.fn().mockResolvedValue(JSON.stringify(mockSettingsJson)),
        }),
      }),
    };
  });

  it.skip("should return parsed settings from the file", async () => {
    const result = await GetSettingsFileFromEvaluationFolder(mockFilesHandle);

    expect(result).toEqual(mockSettingsJson);
  });

  it.skip("should return default settings if settings file is not found", async () => {
    mockFilesHandle.getFileHandle.mockRejectedValue(
      new Error("File not found")
    );

    const result = await GetSettingsFileFromEvaluationFolder(mockFilesHandle);

    expect(result).toEqual(DEFAULT_SESSION_SETTINGS);
  });
});

describe("getGroupFolders", () => {
  let mockHandle: any;
  let mockSetGroups: jest.Mock;

  beforeEach(() => {
    mockHandle = {
      values: jest.fn().mockReturnValue([
        { kind: "directory", name: "Group1" },
        { kind: "directory", name: "Group2" },
      ]),
    };
    mockSetGroups = jest.fn();
  });

  it("should retrieve and set group folders", async () => {
    await getGroupFolders(mockHandle, mockSetGroups);

    expect(mockSetGroups).toHaveBeenCalledWith({
      Status: "complete",
      Values: ["Group1", "Group2"],
    });
  });

  it("should handle errors by setting error status", async () => {
    mockHandle.values.mockRejectedValue(new Error("Error retrieving folders"));

    await getGroupFolders(mockHandle, mockSetGroups);

    expect(mockSetGroups).toHaveBeenCalledWith({
      Status: "error",
      Values: [],
      Error: new Error("Error retrieving folders"),
    });
  });
});

describe("removeGroupFolder", () => {
  let mockHandle: any;

  beforeEach(() => {
    mockHandle = {
      requestPermission: jest.fn().mockResolvedValue("granted"),
      removeEntry: jest.fn().mockResolvedValue(undefined),
    };
  });

  it("should remove the group folder if permission is granted", async () => {
    const group = "Group1";

    await removeGroupFolder(mockHandle, group);

    expect(mockHandle.removeEntry).toHaveBeenCalledWith(group, {
      recursive: true,
    });
  });

  it("should not remove the group folder if permission is denied", async () => {
    mockHandle.requestPermission.mockResolvedValue("denied");

    await removeGroupFolder(mockHandle, "Group1");

    expect(mockHandle.removeEntry).not.toHaveBeenCalled();
  });
});

describe("pullSessionSettings", () => {
  let mockHandle: any;
  let mockGetHandleEvaluationFolder: jest.Mock;
  let mockGetSettingsFileFromEvaluationFolder: jest.Mock;

  beforeEach(() => {
    mockHandle = {};
    mockGetHandleEvaluationFolder = jest.fn().mockResolvedValue({});
    mockGetSettingsFileFromEvaluationFolder = jest.fn().mockResolvedValue({
      Session: 1,
      Condition: "Condition1",
    });

    jest.mock("./yourModulePath", () => ({
      GetHandleEvaluationFolder: mockGetHandleEvaluationFolder,
      GetSettingsFileFromEvaluationFolder:
        mockGetSettingsFileFromEvaluationFolder,
    }));
  });

  it.skip("should return session settings", async () => {
    const group = "Group1";
    const individual = "Individual1";
    const evaluation = "Evaluation1";

    const result = await pullSessionSettings(
      mockHandle,
      group,
      individual,
      evaluation
    );

    expect(result).toEqual({
      Session: 1,
      Condition: "Condition1",
    });
  });
});
