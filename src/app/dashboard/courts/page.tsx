'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks'
import { Court, CourtType } from '@/types/database'
import { useRouter } from 'next/navigation'

export default function CourtsPage() {
  const { isAdmin } = useAuth()
  const router = useRouter()
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCourt, setEditingCourt] = useState<Court | null>(null)

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard')
      return
    }
    fetchCourts()
  }, [isAdmin, router])

  const fetchCourts = async () => {
    try {
      const response = await fetch('/api/courts')
      const data = await response.json()
      if (data.courts) {
        setCourts(data.courts)
      }
    } catch (error) {
      console.error('Error fetching courts:', error)
    }
    setLoading(false)
  }

  const handleDelete = async (courtId: number) => {
    if (!confirm('Are you sure you want to delete this court?')) {
      return
    }

    try {
      const response = await fetch(`/api/courts?court_id=${courtId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCourts(courts.filter(c => c.court_id !== courtId))
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete court')
      }
    } catch (error) {
      console.error('Error deleting court:', error)
      alert('Failed to delete court')
    }
  }

  const getTypeBadgeColor = (type: CourtType) => {
    switch (type) {
      case 'indoor':
        return 'bg-blue-100 text-blue-700'
      case 'outdoor':
        return 'bg-green-100 text-green-700'
      case 'covered':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Court Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create, update, and delete courts.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <PlusIcon className="h-5 w-5" />
          Create Court
        </button>
      </div>

      {/* Courts Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Loading courts...
                </td>
              </tr>
            ) : courts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No courts found. Create one to get started.
                </td>
              </tr>
            ) : (
              courts.map((court) => (
                <tr key={court.court_id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {court.court_id}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {court.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {court.description || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeBadgeColor(court.type)}`}>
                      {court.type}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <button
                      onClick={() => setEditingCourt(court)}
                      className="mr-3 text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(court.court_id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CourtModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchCourts()
          }}
        />
      )}

      {/* Edit Modal */}
      {editingCourt && (
        <CourtModal
          court={editingCourt}
          onClose={() => setEditingCourt(null)}
          onSuccess={() => {
            setEditingCourt(null)
            fetchCourts()
          }}
        />
      )}
    </div>
  )
}

function CourtModal({
  court,
  onClose,
  onSuccess,
}: {
  court?: Court
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState(court?.name || '')
  const [description, setDescription] = useState(court?.description || '')
  const [type, setType] = useState<CourtType>(court?.type || 'indoor')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isEditing = !!court

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/courts', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isEditing && { court_id: court.court_id }),
          name,
          description,
          type,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save court')
        setSaving(false)
        return
      }

      onSuccess()
    } catch (err) {
      setError('Failed to save court')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">
          {isEditing ? 'Edit Court' : 'Create Court'}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CourtType)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="indoor">Indoor</option>
              <option value="outdoor">Outdoor</option>
              <option value="covered">Covered</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}
