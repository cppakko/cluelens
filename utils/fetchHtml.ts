export class HttpError extends Error {
  status: number;
  statusText: string;

  constructor(status: number, statusText: string, method = 'GET') {
    super(`Failed to fetch ${method}: ${status} ${statusText}`);
    this.name = 'HttpError';
    this.status = status;
    this.statusText = statusText;
  }
}

export interface FetchPolicyOptions {
  headers?: HeadersInit;
  timeoutMs?: number;
  signal?: AbortSignal;
}

const DEFAULT_TIMEOUT_MS = 30000;

async function resolveTimeoutMs(timeoutMs?: number): Promise<number> {
  if (typeof timeoutMs === 'number') {
    return timeoutMs;
  }

  return DEFAULT_TIMEOUT_MS;
}

function buildAbortSignal(timeoutMs: number, externalSignal?: AbortSignal) {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

  if (!externalSignal) {
    return {
      signal: timeoutController.signal,
      cleanup: () => clearTimeout(timeoutId),
    };
  }

  const compositeController = new AbortController();
  const abortComposite = () => compositeController.abort();

  timeoutController.signal.addEventListener('abort', abortComposite, { once: true });
  externalSignal.addEventListener('abort', abortComposite, { once: true });

  return {
    signal: compositeController.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      timeoutController.signal.removeEventListener('abort', abortComposite);
      externalSignal.removeEventListener('abort', abortComposite);
    },
  };
}

export async function fetchWithPolicy(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: FetchPolicyOptions = {},
): Promise<Response> {
  const timeoutMs = await resolveTimeoutMs(options.timeoutMs);
  const method = init.method ?? 'GET';

  const { signal, cleanup } = buildAbortSignal(timeoutMs, options.signal);

  try {
    const response = await fetch(input, {
      ...init,
      headers: options.headers ?? init.headers,
      signal,
    });

    if (!response.ok) {
      throw new HttpError(response.status, response.statusText, method);
    }

    return response;
  } finally {
    cleanup();
  }
}

export async function fetchGetHtml(url: string, headers?: Record<string, string>, options?: Omit<FetchPolicyOptions, 'headers'>): Promise<string> {
  const response = await fetchWithPolicy(url, { method: 'GET' }, { ...options, headers });
  return await response.text();
}

export async function fetchPostHtml<T>(url: string, postBody: string, headers?: Record<string, string>, options?: Omit<FetchPolicyOptions, 'headers'>): Promise<T> {
  const response = await fetchWithPolicy(
    url,
    {
      method: 'POST',
      body: postBody,
    },
    {
      ...options,
      headers: {
        'content-type': 'application/json',
        ...headers,
      },
    },
  );

  return await response.json() as T;
}

export async function fetchJson<T>(url: string, init?: RequestInit, options?: FetchPolicyOptions): Promise<T> {
  const response = await fetchWithPolicy(url, init, options);
  return await response.json() as T;
}
