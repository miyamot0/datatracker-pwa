import { unzipSync } from 'fflate';
import demoArchiveUrl from '@/assets/demo/example-data.zip?url';
import { DEMO_ARCHIVE_SHA256 } from '@/lib/demo-archive-hash';

export interface DemoArchiveFile {
  /** Directories below the top-level study folder, e.g. ['Participant 001', 'Baseline'] */
  path: string[];
  filename: string;
  bytes: Uint8Array;
}

/**
 * Computes the lowercase hex SHA-256 digest of the given bytes.
 *
 * @param bytes - Bytes to hash.
 * @returns Hex-encoded digest.
 */
export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Downloads the demo archive and verifies it against the hard-coded SHA-256 before it is returned.
 *
 * @param url - Location of the archive. Defaults to the bundled asset URL.
 * @param fetchFn - Fetch implementation, injectable for tests.
 * @param expectedSha256 - Expected digest, defaults to the generated constant.
 * @returns The verified archive bytes.
 * @throws If the request fails or the digest does not match.
 */
export async function fetchVerifiedDemoArchive(
  url: string = demoArchiveUrl,
  fetchFn: typeof fetch = fetch,
  expectedSha256: string = DEMO_ARCHIVE_SHA256,
): Promise<Uint8Array> {
  const response = await fetchFn(url);
  if (!response.ok) {
    throw new Error(`Could not download example data (HTTP ${response.status}).`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  const actual = await sha256Hex(bytes);
  if (actual !== expectedSha256) {
    throw new Error('Example data failed its integrity check and was not imported.');
  }

  return bytes;
}

/**
 * Extracts a verified demo archive into a flat list of files. The top-level study folder is dropped,
 * matching the layout produced by the former bundled loader.
 *
 * @param bytes - Zip archive bytes. Must already be verified.
 * @returns Files with their relative directory path and filename.
 * @throws If an entry contains traversal or empty path segments.
 */
export function extractDemoArchive(bytes: Uint8Array): DemoArchiveFile[] {
  const entries = unzipSync(bytes);

  return Object.entries(entries)
    .filter(([name]) => !name.endsWith('/') && !name.endsWith('.DS_Store'))
    .map(([name, data]) => {
      const segments = name.split('/');
      const filename = segments[segments.length - 1];
      const directories = segments.slice(1, -1);

      for (const segment of [...directories, filename]) {
        if (segment === '' || segment === '.' || segment === '..' || segment.includes('\\')) {
          throw new Error(`Refusing to extract unsafe path: ${name}`);
        }
      }

      return { path: directories, filename, bytes: data };
    });
}
