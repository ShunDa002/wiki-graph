import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const backendBase =
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, '') ||
    'http://host.docker.internal:8001';
  const backendUrl = `${backendBase}/ask`;

  try {
    const body = await req.json();

    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      return new Response(errorText, {
        status: backendResponse.status,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(backendResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Backend connection error';
    return new Response(JSON.stringify({ message: msg }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
