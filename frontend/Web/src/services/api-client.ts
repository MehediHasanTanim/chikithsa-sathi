import { ApiError, type ApiErrorBody } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';
const DEFAULT_TIMEOUT_MS = 15_000;

type RequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: unknown;
  headers?: HeadersInit;
  timeoutMs?: number;
  accessToken?: string | null;
};

type ApiEnvelope<T> = { success: true; data: T; meta?: { requestId?: string } };
type ApiFailureEnvelope = { success: false; error?: ApiErrorBody; requestId?: string };

function createRequestId() {
  return (
    globalThis.crypto?.randomUUID?.() ?? `web-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

function parseMessage(body: ApiErrorBody | undefined, fallback: string) {
  if (Array.isArray(body?.message)) return body.message.join(', ');
  return body?.message ?? fallback;
}

export async function apiClient<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, timeoutMs = DEFAULT_TIMEOUT_MS, accessToken, ...request } = options;
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  const requestId = createRequestId();

  try {
    const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      ...request,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        'X-Request-ID': requestId,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      signal: controller.signal,
    });

    if (response.status === 204) return undefined as T;
    const responseBody = (await response.json().catch(() => undefined)) as
      ApiEnvelope<T> | ApiFailureEnvelope | ApiErrorBody | undefined;
    if (!response.ok) {
      const failure = responseBody as ApiFailureEnvelope | undefined;
      throw new ApiError(
        parseMessage(
          failure?.error ?? (responseBody as ApiErrorBody | undefined),
          `Request failed (${response.status})`,
        ),
        response.status,
        failure?.error?.code ?? (responseBody as ApiErrorBody | undefined)?.code,
        failure?.requestId ?? response.headers.get('x-request-id') ?? requestId,
      );
    }
    if (responseBody && 'success' in responseBody && responseBody.success) return responseBody.data;
    return responseBody as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('The request timed out. Please try again.', 408, undefined, requestId);
    }
    throw new ApiError(
      'Unable to reach the server. Check your connection and try again.',
      0,
      undefined,
      requestId,
    );
  } finally {
    globalThis.clearTimeout(timer);
  }
}
