import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/profiles - List all profiles or get by id
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', parseInt(id))
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('id');

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}

// POST /api/profiles - Create a new profile (and auth user if password provided)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, confirmPassword, ...profileData } = body;

    // If password is provided, create the auth user first
    if (password) {
      let adminClient;
      try {
        adminClient = createAdminClient();
      } catch (err) {
        return NextResponse.json(
          { error: 'Admin client not configured. Check SUPABASE_SERVICE_ROLE_KEY environment variable.' },
          { status: 500 }
        );
      }

      // Create auth user with email confirmed
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: profileData.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          username: profileData.username,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
        },
      });

      if (authError) {
        console.error('Auth user creation error:', authError);
        return NextResponse.json(
          { error: `Failed to create auth user: ${authError.message}` },
          { status: 400 }
        );
      }

      profileData.auth_id = authData.user.id;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      console.error('Profile creation error:', error);
      return NextResponse.json(
        { error: `Failed to create profile: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// PUT /api/profiles - Update a profile
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
      .from('profiles')
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

// DELETE /api/profiles - Delete a profile and auth user
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  try {
    // First, get the profile to find the auth_id
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('auth_id')
      .eq('id', parseInt(id))
      .single();

    if (fetchError) throw fetchError;

    // Delete the profile
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', parseInt(id));

    if (deleteError) throw deleteError;

    // Delete the auth user using admin client
    if (profile?.auth_id) {
      try {
        const adminClient = createAdminClient();
        await adminClient.auth.admin.deleteUser(profile.auth_id);
      } catch (authError) {
        console.error('Failed to delete auth user:', authError);
        // Profile is already deleted, so we don't fail the request
      }
    }

    return NextResponse.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
