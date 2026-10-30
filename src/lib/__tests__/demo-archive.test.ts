import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import { unzipSync, zipSync } from 'fflate';
import { DEMO_ARCHIVE_SHA256 } from '@/lib/demo-archive-hash';
import { extractDemoArchive, fetchVerifiedDemoArchive, sha256Hex } from '@/lib/demo-archive';

const encoder = new TextEncoder();

function buildZip(files: Record<string, string>): Uint8Array {
  const entries: Record<string, Uint8Array> = {};
  for (const [name, text] of Object.entries(files)) {
    entries[name] = encoder.encode(text);
  }
  return zipSync(entries);
}

function responseWith(bytes: Uint8Array, init: { ok?: boolean; status?: number } = {}): Response {
  return { ok: init.ok ?? true, status: init.status ?? 200, arrayBuffer: async () => bytes.slice().buffer } as Response;
}

describe('sha256Hex', () => {
  it('should match the known SHA-256 of an empty input', async () => {
    expect(await sha256Hex(new Uint8Array())).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });
});

describe('fetchVerifiedDemoArchive', () => {
  it('should return bytes when the digest matches the expected value', async () => {
    const bytes = buildZip({ 'Study/Participant 001/a.json': '{}' });
    const expected = await sha256Hex(bytes);
    const fetchFn = vi.fn().mockResolvedValue(responseWith(bytes));

    const result = await fetchVerifiedDemoArchive('/demo.zip', fetchFn as unknown as typeof fetch, expected);

    expect(fetchFn).toHaveBeenCalledWith('/demo.zip');
    expect(result).toEqual(bytes);
  });

  it('should reject when the digest does not match', async () => {
    const bytes = buildZip({ 'Study/a.json': '{}' });
    const fetchFn = vi.fn().mockResolvedValue(responseWith(bytes));

    await expect(
      fetchVerifiedDemoArchive('/demo.zip', fetchFn as unknown as typeof fetch, 'deadbeef'),
    ).rejects.toThrow('Example data failed its integrity check and was not imported.');
  });

  it('should reject when the response is not ok', async () => {
    const fetchFn = vi.fn().mockResolvedValue(responseWith(new Uint8Array(), { ok: false, status: 404 }));

    await expect(fetchVerifiedDemoArchive('/demo.zip', fetchFn as unknown as typeof fetch)).rejects.toThrow(
      'Could not download example data (HTTP 404).',
    );
  });

  it('should default to the bundled URL and the generated digest', async () => {
    const fetchFn = vi.fn().mockResolvedValue(responseWith(new Uint8Array(), { ok: false, status: 500 }));

    await expect(fetchVerifiedDemoArchive(undefined, fetchFn as unknown as typeof fetch)).rejects.toThrow('HTTP 500');
    expect(fetchFn).toHaveBeenCalledWith(expect.stringContaining('example-data'));
  });
});

describe('extractDemoArchive', () => {
  it('should drop the top-level study folder and keep participant directories', () => {
    const bytes = buildZip({
      'Evaluation Study/Participant 001/Baseline/session.json': 'one',
      'Evaluation Study/Participant 001/FC.json': 'two',
    });

    const files = extractDemoArchive(bytes).map(({ path, filename, bytes: data }) => ({
      path,
      filename,
      text: new TextDecoder().decode(data),
    }));

    expect(files).toEqual([
      { path: ['Participant 001', 'Baseline'], filename: 'session.json', text: 'one' },
      { path: ['Participant 001'], filename: 'FC.json', text: 'two' },
    ]);
  });

  it('should skip directory entries and .DS_Store files', () => {
    const bytes = zipSync({
      'Study/': new Uint8Array(),
      'Study/.DS_Store': encoder.encode('x'),
      'Study/Participant 001/keep.json': encoder.encode('y'),
    });

    const files = extractDemoArchive(bytes);

    expect(files.map((file) => file.filename)).toEqual(['keep.json']);
  });

  it('should handle a file placed directly under the study folder', () => {
    const bytes = buildZip({ 'Study/root.json': 'r' });

    const [file] = extractDemoArchive(bytes);

    expect(file).toMatchObject({ path: [], filename: 'root.json' });
    expect(new TextDecoder().decode(file.bytes)).toBe('r');
  });

  it.each([
    ['parent traversal', 'Study/../escape.json'],
    ['dot segment', 'Study/./a.json'],
    ['empty segment', 'Study//a.json'],
    ['backslash', 'Study/Participant\\evil.json'],
  ])('should refuse entries with %s', (_label, name) => {
    const bytes = zipSync({ [name]: encoder.encode('x') });

    expect(() => extractDemoArchive(bytes)).toThrow('Refusing to extract unsafe path');
  });
});

describe('committed demo archive', () => {
  const archivePath = path.resolve('src/assets/demo/example-data.zip');
  const sourceDir = path.resolve('demo-data');

  function listSourceFiles(dir: string, prefix = ''): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) return listSourceFiles(path.join(dir, entry.name), relative);
      return entry.name === '.DS_Store' ? [] : [relative];
    });
  }

  it('should match the generated SHA-256 constant', () => {
    const archive = new Uint8Array(fs.readFileSync(archivePath));
    const sha = createHash('sha256').update(archive).digest('hex');

    expect(sha).toBe(DEMO_ARCHIVE_SHA256);
  });

  it('should contain exactly the files in demo-data with identical bytes', () => {
    const archive = unzipSync(new Uint8Array(fs.readFileSync(archivePath)));
    const archived = Object.keys(archive).filter((name) => !name.endsWith('/')).sort();
    const source = listSourceFiles(sourceDir).sort();

    expect(archived).toEqual(source);
    for (const name of source) {
      expect(Buffer.from(archive[name]).equals(fs.readFileSync(path.join(sourceDir, name)))).toBe(true);
    }
  });
});
