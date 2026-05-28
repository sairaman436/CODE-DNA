import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions) as any;
    const body = await req.json().catch(() => ({}));

    const targetUsername = body.username;
    if (!targetUsername) {
      return NextResponse.json({ error: 'GitHub username is required.' }, { status: 400 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Authentication required. Please sign in to analyze your repositories.' }, { status: 401 });
    }

    const isAdmin = session.role === 'ADMIN';
    if (!isAdmin) {
      const allowedUsernames = [
        session.githubLogin?.toLowerCase(),
        session.codedna_username?.toLowerCase(),
        session.user?.name?.toLowerCase()
      ].filter(Boolean);

      if (!allowedUsernames.includes(targetUsername.toLowerCase())) {
        return NextResponse.json({ error: 'Forbidden. You can only analyze your own repositories.' }, { status: 403 });
      }
    }

    const isSelf = targetUsername.toLowerCase() === (session?.githubLogin || session?.user?.name || session?.codedna_username)?.toLowerCase();
    const githubId = isSelf ? session?.githubId?.toString() : undefined;
    const displayName = isSelf ? session?.user?.name : targetUsername;
    const avatarUrl = isSelf ? session?.user?.image : null;
    const accessToken = isSelf ? session?.accessToken : undefined;
    const userId = isSelf ? (session?.user?.id || '') : '';

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${backendUrl}/api/analyze`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({
        username: targetUsername,
        github_id: githubId,
        display_name: displayName,
        avatar_url: avatarUrl,
        access_token: accessToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({ 
        error: errorData.error || 'Backend error',
        message: errorData.message || null,
        starred: errorData.starred !== undefined ? errorData.starred : null,
        followed: errorData.followed !== undefined ? errorData.followed : null
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 202 });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

