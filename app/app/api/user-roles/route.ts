import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/user-roles - List all user roles or get by id
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const userId = searchParams.get('user_id');
  const orgId = searchParams.get('org_id');
  const locationId = searchParams.get('location_id');

  try {
    if (id) {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('id', parseInt(id))
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json(
          { error: error.message, code: error.code, details: error.details },
          { status: 500 }
        );
      }
      return NextResponse.json(data);
    }

    let query = supabase.from('user_roles').select('*');

    if (userId) {
      query = query.eq('user_id', parseInt(userId));
    }
    if (orgId) {
      query = query.eq('org_id', orgId);
    }
    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    const { data, error } = await query.order('id');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: 500 }
      );
    }
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred', stack: error instanceof Error ? error.stack : undefined },
      { status: 500 }
    );
  }
}

// POST /api/user-roles - Create a new user role
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { data, error } = await supabase
      .from('user_roles')
      .insert(body)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}

// PUT /api/user-roles - Update a user role
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { data, error } = await supabase
      .from('user_roles')
      .update(body)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}

// DELETE /api/user-roles - Delete a user role
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('id', parseInt(id));

    if (error) throw error;
    return NextResponse.json({ message: 'User role deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
