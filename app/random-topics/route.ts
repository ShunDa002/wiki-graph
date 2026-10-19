export const dynamic = 'force-dynamic';

interface TopicsResponse {
  topics: string[];
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item): item is string => typeof item === 'string')
  );
}

function isTopicsResponse(value: unknown): value is TopicsResponse {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('topics' in value)
  ) {
    return false;
  }

  return isStringArray(value.topics);
}

export async function GET() {
  const backendBase = (
    process.env.NEXT_PUBLIC_BACKEND_URL ?? ''
  ).replace(/\/+$/, '');

  if (backendBase) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2_000);

    try {
      const response = await fetch(`${backendBase}/random-topics`, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (response.ok) {
        const data: unknown = await response.json();

        // Supported format: ["Topic 1", "Topic 2"]
        if (isStringArray(data) && data.length > 0) {
          return Response.json(data);
        }

        // Supported format: { topics: ["Topic 1", "Topic 2"] }
        if (isTopicsResponse(data) && data.topics.length > 0) {
          return Response.json(data.topics);
        }
      }
    } catch {
      // Backend is unavailable, timed out, or returned invalid JSON
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return Response.json(
    { error: 'Failed to fetch topics from backend' },
    { status: 502 }
  );
}