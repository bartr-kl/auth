import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/auth/signup - Create auth user and profile together
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, ...profileData } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch (err) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create auth user (email not confirmed for self-signup)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: false, // User needs to confirm email
      user_metadata: {
        username: profileData.username,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
      },
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // Create profile using admin client (bypasses RLS)
    const { data: profileResult, error: profileError } = await adminClient
      .from('profiles')
      .insert({
        auth_id: authData.user.id,
        username: profileData.username,
        email: email,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        display_name: profileData.display_name || `${profileData.first_name} ${profileData.last_name?.charAt(0) || ''}`.trim(),
        address: profileData.address || null,
        suite: profileData.suite || null,
        city: profileData.city || null,
        state: profileData.state || null,
        zip: profileData.zip || null,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Try to clean up the auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: `Failed to create profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Account created successfully. Please check your email to verify your account.',
      user: authData.user,
      profile: profileResult,
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
