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

    const sessionNames = [
      session?.githubLogin,
      session?.codedna_username,
      session?.user?.name,
    ]
      .filter(Boolean)
      .map((value: string) => value.toLowerCase());
    const isSelf = session ? sessionNames.includes(targetUsername.toLowerCase()) : false;
    const githubId = isSelf ? session?.githubId?.toString() : undefined;
    const displayName = isSelf ? session?.user?.name : targetUsername;
    const avatarUrl = isSelf ? session?.user?.image : null;
    const accessToken = isSelf ? session?.accessToken : undefined;
    const userId = session?.user?.id || '';
    const userEmail = session?.user?.email || '';
    const userRole = session?.role || session?.user?.role || '';
    const sessionGithubId = session?.githubId?.toString() || '';
    const sessionGithubLogin = session?.githubLogin || '';

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${backendUrl}/api/analyze`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': userId,
        'x-user-email': userEmail,
        'x-user-role': userRole,
        'x-github-id': sessionGithubId,
        'x-github-login': sessionGithubLogin,
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
