import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/profiles/check-username?username=xxx&excludeId=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  const excludeId = searchParams.get('excludeId');

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    let query = supabase
      .from('profiles')
      .select('id')
      .eq('username', username);

    // Exclude the current profile when editing
    if (excludeId) {
      query = query.neq('id', parseInt(excludeId));
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      available: data === null,
      username
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
