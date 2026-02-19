import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = await cookies();

  cookieStore.delete('better-auth.session_token');
  cookieStore.delete('better-auth.session_data');

  return NextResponse.json({ success: true });
}
