'use client';

import { useState, useEffect } from 'react';
import { UserRoleRecord, Profile, Org, Location } from '@/lib/types';

export default function UserRolesPage() {
  const [userRoles, setUserRoles] = useState<UserRoleRecord[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<UserRoleRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<string>('');

  useEffect(() => {
    Promise.all([fetchUserRoles(), fetchProfiles(), fetchOrgs(), fetchLocations()]);
  }, []);

  async function fetchUserRoles() {
    try {
      const res = await fetch('/api/user-roles');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch user roles');
      if (data.error) throw new Error(data.error);
      setUserRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function fetchProfiles() {
    try {
      const res = await fetch('/api/profiles');
      if (!res.ok) throw new Error('Failed to fetch profiles');
      const data = await res.json();
      setProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  async function fetchOrgs() {
    try {
      const res = await fetch('/api/orgs');
      if (!res.ok) throw new Error('Failed to fetch organizations');
      const data = await res.json();
      setOrgs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  async function fetchLocations() {
    try {
      const res = await fetch('/api/locations');
      if (!res.ok) throw new Error('Failed to fetch locations');
      const data = await res.json();
      setLocations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      user_id: parseInt(formData.get('user_id') as string),
      org_id: formData.get('org_id') as string,
      location_id: formData.get('location_id') as string,
      role: formData.get('role') as string,
    };

    try {
      const url = editingRole
        ? `/api/user-roles?id=${editingRole.id}`
        : '/api/user-roles';
      const method = editingRole ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to save user role');

      setIsModalOpen(false);
      setEditingRole(null);
      setSelectedOrg('');
      fetchUserRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this user role?')) return;

    try {
      const res = await fetch(`/api/user-roles?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete user role');
      fetchUserRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  function getProfileName(userId: number) {
    const profile = profiles.find(p => p.id === userId);
    return profile ? `${profile.first_name} ${profile.last_name}` : `User ${userId}`;
  }

  function getLocationName(locationId: string) {
    const location = locations.find(l => l.id === locationId);
    return location ? location.name : locationId;
  }

  const filteredLocations = selectedOrg
    ? locations.filter(l => l.org_id === selectedOrg)
    : locations;

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-red-600 text-center py-10">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">User Roles</h1>
        <button
          onClick={() => {
            setEditingRole(null);
            setSelectedOrg('');
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Add User Role
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Org</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {userRoles.map((role) => (
              <tr key={role.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{role.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getProfileName(role.user_id)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.org_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getLocationName(role.location_id)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    role.role === 'admin'
                      ? 'bg-red-100 text-red-800'
                      : role.role === 'staff'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {role.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      setEditingRole(role);
                      setSelectedOrg(role.org_id);
                      setIsModalOpen(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(role.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingRole ? 'Edit User Role' : 'Add User Role'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingRole(null);
                  setSelectedOrg('');
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">User</label>
                <select
                  name="user_id"
                  defaultValue={editingRole?.user_id}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select a user</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.first_name} {profile.last_name} ({profile.username})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Organization</label>
                <select
                  name="org_id"
                  value={selectedOrg}
                  onChange={(e) => setSelectedOrg(e.target.value)}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select an organization</option>
                  {orgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <select
                  name="location_id"
                  defaultValue={editingRole?.location_id}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select a location</option>
                  {filteredLocations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  name="role"
                  defaultValue={editingRole?.role || 'member'}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="member">Member</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingRole(null);
                    setSelectedOrg('');
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  {editingRole ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
