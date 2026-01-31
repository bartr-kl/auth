'use client'

import { useState, useEffect, use } from 'react'
import { useAuth } from '@/hooks'
import { createClient } from '@/lib/supabase/client'
import { Profile, UserRole, DuprType } from '@/types/database'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { canManageUsers, isAdmin } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<UserRole>('user')
  const [address, setAddress] = useState('')
  const [duprSingles, setDuprSingles] = useState('')
  const [duprDoubles, setDuprDoubles] = useState('')
  const [duprType, setDuprType] = useState<DuprType | ''>('')

  useEffect(() => {
    if (!canManageUsers) {
      router.push('/dashboard')
      return
    }

    const fetchUser = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        setError('User not found')
      } else if (data) {
        setProfile(data)
        setFirstName(data.first_name || '')
        setLastName(data.last_name || '')
        setRole(data.role)
        setAddress(data.address || '')
        setDuprSingles(data.dupr_score_singles?.toString() || '')
        setDuprDoubles(data.dupr_score_doubles?.toString() || '')
        setDuprType(data.dupr_type || '')
      }
      setLoading(false)
    }

    fetchUser()
  }, [id, canManageUsers, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        role,
        address,
        dupr_score_singles: duprSingles ? parseFloat(duprSingles) : null,
        dupr_score_doubles: duprDoubles ? parseFloat(duprDoubles) : null,
        dupr_type: duprType as DuprType | null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess('User updated successfully!')
    }
    setSaving(false)
  }

  if (!canManageUsers) {
    return null
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500">Loading user...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-gray-500">User not found</p>
        <Link href="/dashboard/users" className="text-blue-600 hover:text-blue-500">
          Back to Users
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/users"
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
          <p className="mt-1 text-sm text-gray-500">
            {profile.email || profile.phone}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={profile.email || ''}
              disabled
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              disabled={!isAdmin && role === 'admin'}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
            >
              <option value="user">User</option>
              <option value="staff">Staff</option>
              {isAdmin && <option value="admin">Admin</option>}
            </select>
            {!isAdmin && role === 'admin' && (
              <p className="mt-1 text-xs text-gray-500">Only admins can change admin roles.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-md font-medium text-gray-900">DUPR Information</h3>
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Singles Rating</label>
                <input
                  type="number"
                  step="0.001"
                  min="2.000"
                  max="8.000"
                  value={duprSingles}
                  onChange={(e) => setDuprSingles(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Doubles Rating</label>
                <input
                  type="number"
                  step="0.001"
                  min="2.000"
                  max="8.000"
                  value={duprDoubles}
                  onChange={(e) => setDuprDoubles(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">DUPR Type</label>
                <select
                  value={duprType}
                  onChange={(e) => setDuprType(e.target.value as DuprType | '')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="default">Default</option>
                  <option value="api">API (Verified)</option>
                  <option value="self">Self-Reported</option>
                  <option value="instructor">Instructor Rated</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href="/dashboard/users"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  )
}
