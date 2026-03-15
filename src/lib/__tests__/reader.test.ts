import { Mock } from 'vitest';
import { deserializeKeySet } from '../keyset';
import { readKeyboardParameters } from '../reader';

// Mocks
const mockGetFile = vi.fn();
const mockText = vi.fn();

vi.mock('../keyset', () => ({
  deserializeKeySet: vi.fn(),
}));

describe('File Reading Functions', () => {
  const mockFileHandle = {
    kind: 'file',
    name: 'mockfile.json',
    getFile: mockGetFile,
  } as unknown as FileSystemFileHandle;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('readKeyboardParameters', () => {
    it('should return deserialized keyset if the file contains valid JSON', async () => {
      const mockKeySet = {
        /* Mock KeySet properties */
      };
      (deserializeKeySet as Mock).mockReturnValue(mockKeySet);
      mockGetFile.mockResolvedValue({
        text: mockText.mockResolvedValue(JSON.stringify(mockKeySet)),
      } as unknown as File);

      const result = await readKeyboardParameters(mockFileHandle);

      expect(result).toEqual(mockKeySet);
      expect(mockGetFile).toHaveBeenCalled();
      expect(mockText).toHaveBeenCalled();
    });

    it('should return undefined if the file content is empty', async () => {
      mockGetFile.mockResolvedValue({
        text: mockText.mockResolvedValue(''),
      } as unknown as File);

      const result = await readKeyboardParameters(mockFileHandle);

      expect(result).toBeUndefined();
    });

    it('should return undefined if handle is not a file or does not end with .json', async () => {
      const mockDirectoryHandle = {
        kind: 'directory',
      } as unknown as FileSystemFileHandle;

      const result = await readKeyboardParameters(mockDirectoryHandle);

      expect(result).toBeUndefined();
    });
  });
});
