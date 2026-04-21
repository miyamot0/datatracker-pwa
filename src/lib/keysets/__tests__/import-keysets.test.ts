import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createNewKeySet, serializeKeySet } from '@/lib/keyset';
import { CleanUpString } from '@/lib/strings';
import { KeySet } from '@/types/keyset/core';
import * as importKeysetsModule from '../import-keysets';

vi.mock('@/lib/keyset');
vi.mock('@/lib/strings');

type MockEntry = {
  kind: 'file' | 'directory';
  name: string;
};

type MockWritable = {
  write: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
};

type MockFileHandle = {
  createWritable: ReturnType<typeof vi.fn>;
};

type MockDirectoryHandle = {
  getDirectoryHandle: ReturnType<typeof vi.fn>;
  getFileHandle: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
};

function createAsyncIterator<T>(items: T[]): AsyncIterableIterator<T> {
  let index = 0;

  return {
    [Symbol.asyncIterator]() {
      return this;
    },
    async next() {
      if (index < items.length) {
        return { value: items[index++], done: false };
      }
      return { value: undefined, done: true };
    },
  };
}

function createKeySet(name: string): KeySet {
  return {
    id: `${name}-id`,
    Name: name,
    FrequencyKeys: [{ KeyName: 'F1', KeyDescription: 'Frequency key', KeyCode: 70 }],
    DurationKeys: [{ KeyName: 'D1', KeyDescription: 'Duration key', KeyCode: 68 }],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    lastModified: new Date('2026-01-01T00:00:00.000Z'),
    DerivedKeys: [],
    SpecialDurationKeys: [],
    ScorableDurationKeys: [],
  };
}

describe('import-keysets', () => {
  const mockedCreateNewKeySet = vi.mocked(createNewKeySet);
  const mockedSerializeKeySet = vi.mocked(serializeKeySet);
  const mockedCleanUpString = vi.mocked(CleanUpString);

  let rootHandle: MockDirectoryHandle;
  let groupHandle: MockDirectoryHandle;
  let individualHandle: MockDirectoryHandle;
  let keysetFileHandle: MockFileHandle;
  let writable: MockWritable;
  let alertSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockedCleanUpString.mockImplementation((value: string) => `clean-${value}`);

    writable = {
      write: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    };

    keysetFileHandle = {
      createWritable: vi.fn().mockResolvedValue(writable),
    };

    individualHandle = {
      getDirectoryHandle: vi.fn(),
      getFileHandle: vi.fn().mockResolvedValue(keysetFileHandle),
      values: vi.fn(),
    };

    groupHandle = {
      getDirectoryHandle: vi.fn().mockResolvedValue(individualHandle),
      getFileHandle: vi.fn(),
      values: vi.fn(),
    };

    rootHandle = {
      getDirectoryHandle: vi.fn().mockResolvedValue(groupHandle),
      getFileHandle: vi.fn(),
      values: vi.fn(),
    };

    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
  });

  it('imports a keyset when no duplicate exists', async () => {
    const input = createKeySet('Alpha');
    const generated = createKeySet('Alpha');

    mockedCreateNewKeySet.mockReturnValue(generated);
    mockedSerializeKeySet.mockReturnValue('{"Name":"Alpha"}');

    individualHandle.values.mockReturnValue(
      createAsyncIterator<MockEntry>([
        { kind: 'directory', name: 'Subfolder' },
        { kind: 'file', name: 'OtherKeyset' },
      ]),
    );

    const result = await importKeysetsModule.importExistingKeyset(rootHandle as any, 'Group A', 'Person A', input);

    expect(rootHandle.getDirectoryHandle).toHaveBeenCalledWith('clean-Group A', { create: true });
    expect(groupHandle.getDirectoryHandle).toHaveBeenCalledWith('clean-Person A', { create: true });
    expect(individualHandle.getFileHandle).toHaveBeenCalledWith('Alpha.json', { create: true });
    expect(mockedCreateNewKeySet).toHaveBeenCalledWith('Alpha');
    expect(mockedSerializeKeySet).toHaveBeenCalledTimes(1);
    expect(writable.write).toHaveBeenCalledWith('{"Name":"Alpha"}');
    expect(writable.close).toHaveBeenCalledTimes(1);
    expect(alertSpy).not.toHaveBeenCalled();
    expect(result).toEqual({
      ...generated,
      FrequencyKeys: input.FrequencyKeys,
      DurationKeys: input.DurationKeys,
    });
  });

  it('returns null and alerts when a duplicate keyset exists', async () => {
    const input = createKeySet('Alpha');

    individualHandle.values.mockReturnValue(createAsyncIterator<MockEntry>([{ kind: 'file', name: 'Alpha' }]));

    const result = await importKeysetsModule.importExistingKeyset(rootHandle as any, 'Group A', 'Person A', input);

    expect(alertSpy).toHaveBeenCalledWith('Keyset already exists');
    expect(result).toBeNull();
    expect(mockedCreateNewKeySet).not.toHaveBeenCalled();
    expect(individualHandle.getFileHandle).not.toHaveBeenCalled();
  });

  it('imports multiple keysets and skips duplicates', async () => {
    const keysetA = createKeySet('One');
    const keysetB = createKeySet('Two');
    const generatedA = createKeySet('One');

    mockedCreateNewKeySet.mockReturnValue(generatedA);
    mockedSerializeKeySet.mockReturnValue('{"Name":"One"}');

    individualHandle.values
      .mockReturnValueOnce(createAsyncIterator<MockEntry>([{ kind: 'file', name: 'Other' }]))
      .mockReturnValueOnce(createAsyncIterator<MockEntry>([{ kind: 'file', name: 'Two' }]));

    const result = await importKeysetsModule.importExistingKeysets(rootHandle as any, 'Group A', 'Person A', [
      keysetA,
      keysetB,
    ]);

    expect(individualHandle.getFileHandle).toHaveBeenCalledTimes(1);
    expect(individualHandle.getFileHandle).toHaveBeenCalledWith('One.json', { create: true });
    expect(alertSpy).toHaveBeenCalledWith('Keyset already exists');
    expect(result).toEqual([
      {
        ...generatedA,
        FrequencyKeys: keysetA.FrequencyKeys,
        DurationKeys: keysetA.DurationKeys,
      },
    ]);
  });
});
