import { NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';

/**
 * Check if the request is authenticated.
 * Returns the session if authenticated, or a 401 NextResponse if not.
 */
export async function requireAuth() {
    const session = await auth();
    if (!session?.user) {
        return { authorized: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }
    return { authorized: true as const, session };
}
