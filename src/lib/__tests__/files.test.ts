import { DEFAULT_SESSION_SETTINGS } from '../dtos';
import {
  getGroupFolders,
  GetHandleEvaluationFolder,
  GetHandleKeyboardsFolder,
  GetSettingsFileFromEvaluationFolder,
  pullSessionSettings,
  removeGroupFolder,
} from '../files';
import { describe, vi, it } from 'vitest';

describe('GetHandleEvaluationFolder', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockHandle: any;

  beforeEach(() => {
    mockHandle = {
      getDirectoryHandle: vi.fn().mockResolvedValue({
        getDirectoryHandle: vi.fn().mockResolvedValue({
          getDirectoryHandle: vi.fn().mockResolvedValue({}),
        }),
      }),
    };
  });

  it('should create and return the evaluation folder handle', async () => {
    const group = 'Group1';
    const individual = 'Individual1';
    const evaluation = 'Evaluation1';

    const result = await GetHandleEvaluationFolder(mockHandle, group, individual, evaluation);

    expect(mockHandle.getDirectoryHandle).toHaveBeenCalledWith(group, {
      create: true,
    });
    expect(result).toBeDefined();
  });
});

describe('GetHandleKeyboardsFolder', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockHandle: any;

  beforeEach(() => {
    mockHandle = {
      getDirectoryHandle: vi.fn().mockResolvedValue({
        getDirectoryHandle: vi.fn().mockResolvedValue({}),
      }),
    };
  });

  it.skip('should create and return the keyboards folder handle', async () => {
    const group = 'Group1';
    const individual = 'Individual1';

    const result = await GetHandleKeyboardsFolder(mockHandle, group, individual);

    expect(mockHandle.getDirectoryHandle).toHaveBeenCalledWith(group, {
      create: true,
    });
    expect(result).toThrow();
  });
});

describe('GetSettingsFileFromEvaluationFolder', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockFilesHandle: any;
  const mockSettingsJson = { some: 'settings' };

  beforeEach(() => {
    mockFilesHandle = {
      getFileHandle: vi.fn().mockResolvedValue({
        getFile: vi.fn().mockResolvedValue({
          text: vi.fn().mockResolvedValue(JSON.stringify(mockSettingsJson)),
        }),
      }),
    };
  });

  it.skip('should return parsed settings from the file', async () => {
    const result = await GetSettingsFileFromEvaluationFolder(mockFilesHandle);

    expect(result).toEqual(mockSettingsJson);
  });

  it.skip('should return default settings if settings file is not found', async () => {
    mockFilesHandle.getFileHandle.mockRejectedValue(new Error('File not found'));

    const result = await GetSettingsFileFromEvaluationFolder(mockFilesHandle);

    expect(result).toEqual(DEFAULT_SESSION_SETTINGS);
  });
});

describe('getGroupFolders', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockHandle: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSetGroups: any;

  beforeEach(() => {
    mockHandle = {
      values: vi.fn().mockReturnValue([
        { kind: 'directory', name: 'Group1' },
        { kind: 'directory', name: 'Group2' },
      ]),
    };
    mockSetGroups = vi.fn();
  });

  it('should retrieve and set group folders', async () => {
    await getGroupFolders(mockHandle, mockSetGroups);

    expect(mockSetGroups).toHaveBeenCalledWith({
      Status: 'complete',
      Values: ['Group1', 'Group2'],
    });
  });

  it('should handle errors by setting error status', async () => {
    mockHandle.values.mockRejectedValue(new Error('Error retrieving folders'));

    await getGroupFolders(mockHandle, mockSetGroups);

    expect(mockSetGroups).toHaveBeenCalledWith({
      Status: 'error',
      Values: [],
      Error: new Error('Error retrieving folders'),
    });
  });
});

describe('removeGroupFolder', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockHandle: any;

  beforeEach(() => {
    mockHandle = {
      requestPermission: vi.fn().mockResolvedValue('granted'),
      removeEntry: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('should remove the group folder if permission is granted', async () => {
    const group = 'Group1';

    await removeGroupFolder(mockHandle, group);

    expect(mockHandle.removeEntry).toHaveBeenCalledWith(group, {
      recursive: true,
    });
  });

  it('should not remove the group folder if permission is denied', async () => {
    mockHandle.requestPermission.mockResolvedValue('denied');

    await removeGroupFolder(mockHandle, 'Group1');

    expect(mockHandle.removeEntry).not.toHaveBeenCalled();
  });
});

describe('pullSessionSettings', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockHandle: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockGetHandleEvaluationFolder: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockGetSettingsFileFromEvaluationFolder: any;

  beforeEach(() => {
    mockHandle = {};
    mockGetHandleEvaluationFolder = vi.fn().mockResolvedValue({});
    mockGetSettingsFileFromEvaluationFolder = vi.fn().mockResolvedValue({
      Session: 1,
      Condition: 'Condition1',
    });

    vi.mock('./yourModulePath', () => ({
      GetHandleEvaluationFolder: mockGetHandleEvaluationFolder,
      GetSettingsFileFromEvaluationFolder: mockGetSettingsFileFromEvaluationFolder,
    }));
  });

  it.skip('should return session settings', async () => {
    const group = 'Group1';
    const individual = 'Individual1';
    const evaluation = 'Evaluation1';

    const result = await pullSessionSettings(mockHandle, group, individual, evaluation);

    expect(result).toEqual({
      Session: 1,
      Condition: 'Condition1',
    });
  });
});
