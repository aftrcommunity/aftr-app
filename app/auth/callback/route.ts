import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase/server';

// The link in the sign-in email lands here; we finish signing in,
// then send the person on to where they belong.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL('/login?link=expired', url.origin));
  }
  return NextResponse.redirect(new URL('/auth/route', url.origin));
}
