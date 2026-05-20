import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions) as any;
    const body = await req.json().catch(() => ({}));

    // Allow analysis with or without session (public profile analysis)
    const username = body.username || session?.githubLogin || session?.user?.name;
    const githubId = session?.githubId?.toString() || username || 'anonymous';
    const userId = session?.user?.id || body.user_id || '';

    if (!username) {
      return NextResponse.json({ error: 'No username provided' }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${backendUrl}/api/analyze`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({
        username,
        github_id: githubId,
        display_name: session?.user?.name || username,
        avatar_url: session?.user?.image || null,
        access_token: session?.accessToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error || 'Backend error' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 202 });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

