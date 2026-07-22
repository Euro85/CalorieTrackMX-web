import { NextRequest, NextResponse } from 'next/server';

const LAMBDA = 'https://0xysdofiye.execute-api.us-east-2.amazonaws.com/default/calorietrack-api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const auth = req.headers.get('Authorization');

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (auth) headers['Authorization'] = auth;

    const upstream = await fetch(LAMBDA, { method: 'POST', headers, body });
    const data = await upstream.json();

    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error('[proxy]', err);
    return NextResponse.json({ error: 'Proxy error' }, { status: 502 });
  }
}
