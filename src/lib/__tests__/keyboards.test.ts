import { getClientKeyboards } from '../keyboards';
import { Dispatch, SetStateAction } from 'react';
import { LoadingStructureKeysets } from '../../types/working';
import { KeySet } from '../../types/keyset';

//const holder = { GetHandleKeyboardsFolder };
//const holder2 = { readKeyboardParameters };

vi.mock('../files', () => ({
  GetHandleKeyboardsFolder: vi.fn().mockResolvedValue({
    values: vi.fn().mockReturnValueOnce([{}]),
  }),
}));

vi.mock('../reader', () => ({
  readKeyboardParameters: vi.fn().mockReturnValue({
    id: '',
    Name: '',
  } as unknown as KeySet),
}));

describe('getClientKeyboards', () => {
  beforeEach(() => {
    //vi.clearAllMocks();
  });

  it('should set the keysets if the folder is found', async () => {
    const mockSetKeyboards = vi.fn();

    await getClientKeyboards(
      {} as unknown as FileSystemDirectoryHandle,
      'groupName',
      'individualName',
      mockSetKeyboards as Dispatch<SetStateAction<LoadingStructureKeysets>>
    );

    expect(mockSetKeyboards).toHaveBeenCalledWith({
      Status: 'complete',
      KeySets: [{ id: '', Name: '' }],
    });
  });

  it('should fail if error is thrown ', async () => {
    const mockSetKeyboards = vi.fn();

    await getClientKeyboards(
      {} as unknown as FileSystemDirectoryHandle,
      'groupName',
      'individualName',
      mockSetKeyboards as Dispatch<SetStateAction<LoadingStructureKeysets>>
    );

    expect(mockSetKeyboards).toHaveBeenCalledWith({
      KeySets: [],
      Status: 'error',
      Error: "Cannot read properties of undefined (reading 'Symbol(Symbol.asyncIterator)')",
    });
  });
});
