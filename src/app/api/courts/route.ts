import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

async function verifyAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized', status: 401 }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null }

  if (!profile || profile.role !== 'admin') {
    return { error: 'Insufficient permissions - admin required', status: 403 }
  }

  return { user, profile }
}

// GET - List all courts
export async function GET() {
  try {
    const supabase = await createServerClient()

    const { data: courts, error } = await supabase
      .from('courts')
      .select('*')
      .order('court_id', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ courts })
  } catch (error) {
    console.error('Error fetching courts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new court
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { name, description, type = 'indoor' } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const validTypes = ['indoor', 'outdoor', 'covered']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid court type. Must be indoor, outdoor, or covered' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: court, error } = await supabaseAdmin
      .from('courts')
      .insert({
        name,
        description,
        type
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ court }, { status: 201 })
  } catch (error) {
    console.error('Error creating court:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a court
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAdmin()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { court_id, name, description, type } = body

    if (!court_id) {
      return NextResponse.json({ error: 'court_id is required' }, { status: 400 })
    }

    const updateData: Record<string, string> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (type !== undefined) {
      const validTypes = ['indoor', 'outdoor', 'covered']
      if (!validTypes.includes(type)) {
        return NextResponse.json({ error: 'Invalid court type. Must be indoor, outdoor, or covered' }, { status: 400 })
      }
      updateData.type = type
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: court, error } = await supabaseAdmin
      .from('courts')
      .update(updateData)
      .eq('court_id', court_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 })
    }

    return NextResponse.json({ court })
  } catch (error) {
    console.error('Error updating court:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a court
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdmin()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const courtId = searchParams.get('court_id')

    if (!courtId) {
      return NextResponse.json({ error: 'court_id is required' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { error } = await supabaseAdmin
      .from('courts')
      .delete()
      .eq('court_id', parseInt(courtId))

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Court deleted successfully' })
  } catch (error) {
    console.error('Error deleting court:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
