import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const secretKey = process.env.GRAPH_REBUILD_SECRET_KEY || 'local_dev_secret';

  // 1. Validate incoming Authorization header
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const adminHeader = request.headers.get('x-admin-secret');

  const incomingSecret = token || adminHeader;

  if (!incomingSecret || incomingSecret !== secretKey) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing administrative credential' },
      { status: 401 }
    );
  }

  // 2. Resolve backend URL
  const backendBaseUrl = (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'http://localhost:8000'
  ).replace(/\/+$/, '');

  try {
    // 3. Proxy POST request to backend with X-Graph-API-Key header
    const backendRes = await fetch(`${backendBaseUrl}/graph/rebuild`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Graph-API-Key': secretKey,
      },
    });

    const responseBody = await backendRes.json().catch(() => ({
      status: backendRes.ok ? 'success' : 'error',
      message: backendRes.statusText,
    }));

    return NextResponse.json(responseBody, {
      status: backendRes.status,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: 'Bad Gateway: Failed to contact backend rebuild service',
        details: errorMsg,
      },
      { status: 502 }
    );
  }
}
