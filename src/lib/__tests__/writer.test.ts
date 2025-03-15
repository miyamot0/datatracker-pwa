import { saveSessionSettingsToFile, saveSessionOutcomesToFile } from '../writer'; // Adjust the import path
import { SavedSettings } from '../dtos';
import { KeyManageType } from '../../components/pages/session-recorder/types/session-recorder-types';
import { KeySet } from '../../types/keyset';
import { CleanUpString } from '../strings';
import { Mock } from 'vitest';
import { GetHandleEvaluationFolder } from '../files';

// Mock the dependencies
vi.mock('../files');
vi.mock('../strings');

describe('File Save Functions', () => {
  const mockHandle = {
    getDirectoryHandle: vi.fn(),
    getFileHandle: vi.fn(),
    requestPermission: vi.fn(),
    removeEntry: vi.fn(),
  } as unknown as FileSystemDirectoryHandle;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveSessionSettingsToFile', () => {
    it('should save updated session settings to a file', async () => {
      const mockGroup = 'testGroup';
      const mockIndividual = 'testIndividual';
      const mockEvaluation = 'testEvaluation';
      const mockSettings: SavedSettings = {
        Session: 1,
        Condition: 'testCondition',
        Role: 'testRole',
        // Add other settings properties here
      } as unknown as SavedSettings;

      // Mock implementations
      (GetHandleEvaluationFolder as Mock).mockResolvedValue({
        values: vi.fn().mockResolvedValue(['settings.json']),
        getFileHandle: vi.fn().mockResolvedValue({
          createWritable: vi.fn().mockResolvedValue({
            write: vi.fn(),
            close: vi.fn(),
          }),
        }),
      });
      (mockHandle.getDirectoryHandle as Mock).mockResolvedValue({
        getFileHandle: vi.fn().mockResolvedValue({
          createWritable: vi.fn().mockResolvedValue({
            write: vi.fn(),
            close: vi.fn(),
          }),
        }),
      });

      await saveSessionSettingsToFile(mockHandle, mockGroup, mockIndividual, mockEvaluation, mockSettings);

      expect(GetHandleEvaluationFolder).toHaveBeenCalledWith(
        mockHandle,
        CleanUpString(mockGroup),
        CleanUpString(mockIndividual),
        CleanUpString(mockEvaluation)
      );
    });

    it('should throw an error if no directory is found', async () => {
      (GetHandleEvaluationFolder as Mock).mockResolvedValue(null);

      await expect(
        saveSessionSettingsToFile(mockHandle, 'group', 'individual', 'evaluation', {
          Session: 1,
          Condition: 'condition',
          Role: 'role',
        } as unknown as SavedSettings)
      ).rejects.toThrow('No directory found for this evaluation');
    });
  });

  describe('saveSessionOutcomesToFile', () => {
    it('should save session outcomes to a file', async () => {
      const mockGroup = 'testGroup';
      const mockClient = 'testClient';
      const mockEvaluation = 'testEvaluation';
      const mockSettings: SavedSettings = {
        Session: 1,
        Condition: 'testCondition',
        Role: 'testRole',
        // Add other settings properties here
      } as unknown as SavedSettings;
      const mockKeysPressed: KeyManageType[] = [
        { KeyType: 'Frequency', Key: 'key1' } as unknown as KeyManageType,
        { KeyType: 'Duration', Key: 'key2' } as unknown as KeyManageType,
      ];
      const mockSystemKeys: KeyManageType[] = [{ KeyType: 'System', Key: 'systemKey' } as unknown as KeyManageType];
      const mockKeySet: KeySet = {
        /* Mock KeySet properties */
      } as KeySet;
      const mockSessionStart = new Date();

      // Mock implementations
      (GetHandleEvaluationFolder as Mock).mockResolvedValue({
        getDirectoryHandle: vi.fn().mockResolvedValue({
          getFileHandle: vi.fn().mockResolvedValue({
            createWritable: vi.fn().mockResolvedValue({
              write: vi.fn(),
              close: vi.fn(),
            }),
          }),
        }),
      });
      (mockHandle.getDirectoryHandle as Mock).mockResolvedValue({
        getDirectoryHandle: vi.fn().mockResolvedValue({
          getFileHandle: vi.fn().mockResolvedValue({
            createWritable: vi.fn().mockResolvedValue({
              write: vi.fn(),
              close: vi.fn(),
            }),
          }),
        }),
      });

      await saveSessionOutcomesToFile(
        mockHandle,
        mockSettings,
        mockKeysPressed,
        mockSystemKeys,
        mockKeySet,
        mockGroup,
        mockClient,
        mockEvaluation,
        mockSessionStart,
        60,
        30,
        20,
        10
      );

      expect(GetHandleEvaluationFolder).toHaveBeenCalledWith(
        mockHandle,
        CleanUpString(mockGroup),
        CleanUpString(mockClient),
        CleanUpString(mockEvaluation)
      );
    });

    it('should handle errors during file operations', async () => {
      (GetHandleEvaluationFolder as Mock).mockResolvedValue(null);

      await expect(
        saveSessionOutcomesToFile(
          mockHandle,
          {
            Session: 1,
            Condition: 'condition',
            Role: 'role',
          } as unknown as SavedSettings,
          [],
          [],
          {} as KeySet,
          'group',
          'client',
          'evaluation',
          new Date(),
          60,
          30,
          20,
          10
        )
      ).rejects.toThrow();
    });
  });
});
