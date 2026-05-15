import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const username = params.username;
  
  try {
    // In a real app, this would query the DB for the user's score/profile
    // For now, we simulate fetching the user's data from the backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    // Attempt to fetch profile
    let profileData = null;
    try {
      const res = await fetch(`${apiUrl}/api/profile/${username}`, { next: { revalidate: 3600 } });
      if (res.ok) {
        profileData = await res.json();
      }
    } catch (e) {
      console.warn("Could not fetch profile for badge, using fallback data", e);
    }

    // Default fallback values
    let score = 0;
    let type = "Unanalyzed";
    let dominantTrait = "Unknown";
    
    if (profileData && profileData.radar) {
      score = Math.round(profileData.radar.reduce((acc: number, r: any) => acc + r.value, 0) / profileData.radar.length);
      type = profileData.type || "Developer";
      dominantTrait = profileData.strengths?.[0] || "Generalist";
    }

    const badgeRank = score >= 95 ? "Code Grandmaster" 
      : score >= 80 ? "Elite Hacker" 
      : score >= 60 ? "System Architect" 
      : score >= 40 ? "Script Hacker" 
      : "Code Newbie";

    // SVG Template (Stark Minimalist Theme)
    const svg = `
      <svg width="340" height="120" viewBox="0 0 340 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="340" height="120" rx="16" fill="#09090b"/>
        <rect x="0.5" y="0.5" width="339" height="119" rx="15.5" stroke="#27272a"/>
        
        <!-- Logo -->
        <rect x="20" y="20" width="32" height="32" rx="8" fill="#18181b" stroke="#3f3f46"/>
        <path d="M36 26L26 31L36 36L46 31L36 26ZM26 41L36 46L46 41M26 36L36 41L46 36" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        
        <!-- Title (Rank) -->
        <text x="64" y="36" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="14" font-weight="900" text-transform="uppercase" letter-spacing="0.05em" fill="#fde68a">${badgeRank}</text>
        <text x="64" y="52" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="12" fill="#a1a1aa">@${username}</text>
        
        <!-- Score -->
        <text x="290" y="44" font-family="monospace" font-size="28" font-weight="900" fill="#ffffff" text-anchor="end">${score}</text>
        <text x="315" y="40" font-family="monospace" font-size="14" font-weight="bold" fill="#71717a" text-anchor="end">%</text>
        
        <!-- Divider -->
        <line x1="20" y1="72" x2="320" y2="72" stroke="#27272a" stroke-width="1"/>
        
        <!-- Bottom Stats -->
        <text x="20" y="96" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="10" font-weight="bold" letter-spacing="0.1em" fill="#71717a" text-transform="uppercase">Class</text>
        <text x="20" y="108" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="12" font-weight="600" fill="#ffffff">${type}</text>
        
        <text x="140" y="96" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="10" font-weight="bold" letter-spacing="0.1em" fill="#71717a" text-transform="uppercase">Trait</text>
        <text x="140" y="108" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="12" font-weight="600" fill="#ffffff">${dominantTrait}</text>
        
        <!-- Visual Decorator -->
        <circle cx="316" cy="104" r="4" fill="#ffffff"/>
        <circle cx="316" cy="104" r="8" fill="none" stroke="#ffffff" stroke-opacity="0.2"/>
      </svg>
    `.trim();

    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    return new NextResponse('Error generating badge', { status: 500 });
  }
}
