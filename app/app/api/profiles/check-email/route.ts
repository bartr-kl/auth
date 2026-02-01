import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/profiles/check-email?email=xxx&excludeId=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const excludeId = searchParams.get('excludeId');

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    let query = supabase
      .from('profiles')
      .select('id')
      .eq('email', email);

    // Exclude the current profile when editing
    if (excludeId) {
      query = query.neq('id', parseInt(excludeId));
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      available: data === null,
      email
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
