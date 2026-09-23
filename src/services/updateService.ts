import appConfig from '../../app.json';

const VERSION_FILE_URL =
  'https://raw.githubusercontent.com/lim0n4ikz/flashcards/main/version.json';
const REQUEST_TIMEOUT_MS = 5000;

interface RemoteVersionRelease {
  version: string;
  url?: string;
  changes?: string[];
}

interface RemoteVersionFile {
  version?: string;
  latestVersion?: string;
  url?: string;
  changes?: string[];
  releases?: RemoteVersionRelease[];
}

export interface UpdateInfo {
  version: string;
  url: string;
  changes: string[];
}

const expoConfig = appConfig as {
  expo?: {
    version?: string;
  };
};

export function getCurrentVersion(): string {
  return expoConfig.expo?.version ?? '0.0.0';
}

export function compareVersions(left: string, right: string): number {
  const parseVersion = (version: string) => {
    const parts = version.replace(/^v/i, '').split('.');

    if (parts.length < 2 || parts.some((part) => !/^\d+$/.test(part))) {
      return null;
    }

    return [
      Number(parts[0]),
      Number(parts[1]),
      Number(parts[2] ?? 0),
    ];
  };

  const leftParts = parseVersion(left);
  const rightParts = parseVersion(right);

  if (!leftParts || !rightParts) {
    return 0;
  }

  for (let index = 0; index < leftParts.length; index += 1) {
    if (leftParts[index] !== rightParts[index]) {
      return leftParts[index] > rightParts[index] ? 1 : -1;
    }
  }

  return 0;
}

export function getChangesForVersionRange(
  currentVersion: string,
  releases: RemoteVersionRelease[]
): string[] {
  const sortedReleases = [...releases]
    .filter(
      (release) =>
        typeof release.version === 'string' &&
        compareVersions(release.version, currentVersion) > 0
    )
    .sort((left, right) => compareVersions(left.version, right.version));

  const changes: string[] = [];
  const seen = new Set<string>();

  for (const release of sortedReleases) {
    for (const change of release.changes ?? []) {
      if (typeof change !== 'string' || seen.has(change)) {
        continue;
      }

      seen.add(change);
      changes.push(change);
    }
  }

  return changes;
}

export async function fetchLatestVersion(): Promise<RemoteVersionFile> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch(VERSION_FILE_URL, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Version request failed: ${response.status}`);
    }

    const payload = (await response.json()) as Partial<RemoteVersionFile> & {
      releases?: Array<
        Partial<RemoteVersionRelease> & {
          version?: string;
          changes?: unknown;
        }
      >;
    };

    const releases = Array.isArray(payload.releases)
      ? payload.releases
          .filter(
            (release): release is Partial<RemoteVersionRelease> & {
              version: string;
            } =>
              typeof release?.version === 'string' &&
              (release.changes === undefined ||
                (Array.isArray(release.changes) &&
                  release.changes.every((change) => typeof change === 'string')))
          )
          .map((release) => ({
            version: release.version,
            url: typeof release.url === 'string' ? release.url : undefined,
            changes: Array.isArray(release.changes)
              ? release.changes.filter((change): change is string => typeof change === 'string')
              : [],
          }))
      : [];

    const versionValue =
      typeof payload.version === 'string'
        ? payload.version
        : typeof payload.latestVersion === 'string'
          ? payload.latestVersion
          : releases[releases.length - 1]?.version ?? '0.0.0';

    const urlValue =
      typeof payload.url === 'string'
        ? payload.url
        : releases[releases.length - 1]?.url ?? '';

    const changesValue =
      releases.length > 0
        ? getChangesForVersionRange(getCurrentVersion(), releases)
        : Array.isArray(payload.changes)
          ? payload.changes.filter((change): change is string => typeof change === 'string')
          : [];

    if (
      !versionValue ||
      (typeof payload.url !== 'string' && !urlValue) ||
      (!releases.length &&
        payload.changes !== undefined &&
        (!Array.isArray(payload.changes) ||
          payload.changes.some((change) => typeof change !== 'string')))
    ) {
      throw new Error('Invalid version file');
    }

    return {
      version: versionValue,
      url: urlValue,
      changes: changesValue,
      releases,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    const latest = await fetchLatestVersion();

    if (compareVersions(latest.version ?? '0.0.0', getCurrentVersion()) <= 0) {
      return null;
    }

    return {
      version: latest.version ?? getCurrentVersion(),
      url: latest.url ?? '',
      changes: latest.changes ?? [],
    };
  } catch {
    return null;
  }
}
