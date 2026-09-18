import appConfig from '../../app.json';

const VERSION_FILE_URL =
  'https://raw.githubusercontent.com/lim0n4ikz/flashcards/main/version.json';
const REQUEST_TIMEOUT_MS = 5000;

interface RemoteVersionFile {
  version: string;
  url: string;
  changes?: string[];
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

    const payload = (await response.json()) as Partial<RemoteVersionFile>;

    if (
      typeof payload.version !== 'string' ||
      typeof payload.url !== 'string' ||
      (payload.changes !== undefined &&
        (!Array.isArray(payload.changes) ||
          payload.changes.some((change) => typeof change !== 'string')))
    ) {
      throw new Error('Invalid version file');
    }

    return {
      version: payload.version,
      url: payload.url,
      changes: payload.changes ?? [],
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    const latest = await fetchLatestVersion();

    if (compareVersions(latest.version, getCurrentVersion()) <= 0) {
      return null;
    }

    return {
      version: latest.version,
      url: latest.url,
      changes: latest.changes ?? [],
    };
  } catch {
    return null;
  }
}
