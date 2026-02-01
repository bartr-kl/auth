'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Profile } from '@/lib/types';

// Generate display name as "FirstName L" (Pascal case)
function generateDisplayName(firstName: string, lastName: string): string {
  if (!firstName) return '';
  const pascalFirst = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  const lastInitial = lastName.charAt(0)?.toUpperCase() || '';
  return lastName ? `${pascalFirst} ${lastInitial}` : pascalFirst;
}

// Generate username as lowercase first_name + first char of last_name (no spaces)
function generateUsername(firstName: string, lastName: string): string {
  if (!firstName) return '';
  const first = firstName.toLowerCase().replace(/\s+/g, '');
  const lastInitial = lastName.charAt(0)?.toLowerCase() || '';
  return `${first}${lastInitial}`;
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [displayNameManuallyEdited, setDisplayNameManuallyEdited] = useState(false);
  const [usernameManuallyEdited, setUsernameManuallyEdited] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameValue, setUsernameValue] = useState('');
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const displayNameRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const usernameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emailCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check username availability with debounce
  const checkUsernameAvailability = useCallback(async (username: string, excludeId?: number) => {
    if (!username || username.length < 2) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const url = excludeId
        ? `/api/profiles/check-username?username=${encodeURIComponent(username)}&excludeId=${excludeId}`
        : `/api/profiles/check-username?username=${encodeURIComponent(username)}`;
      const res = await fetch(url);
      const data = await res.json();
      setUsernameAvailable(data.available);
    } catch (err) {
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  }, []);

  // Check email availability with debounce
  const checkEmailAvailability = useCallback(async (email: string, excludeId?: number) => {
    if (!email || !email.includes('@')) {
      setEmailAvailable(null);
      return;
    }

    setCheckingEmail(true);
    try {
      const url = excludeId
        ? `/api/profiles/check-email?email=${encodeURIComponent(email)}&excludeId=${excludeId}`
        : `/api/profiles/check-email?email=${encodeURIComponent(email)}`;
      const res = await fetch(url);
      const data = await res.json();
      setEmailAvailable(data.available);
    } catch (err) {
      setEmailAvailable(null);
    } finally {
      setCheckingEmail(false);
    }
  }, []);

  // Handle email change
  function handleEmailChange() {
    const email = emailRef.current?.value || '';
    setEmailValue(email);

    // Debounce email check
    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current);
    }
    emailCheckTimeoutRef.current = setTimeout(() => {
      checkEmailAvailability(email, editingProfile?.id);
    }, 300);
  }

  // Update display name and username when first/last name changes
  function handleNameChange() {
    const firstName = firstNameRef.current?.value || '';
    const lastName = lastNameRef.current?.value || '';

    if (!displayNameManuallyEdited && displayNameRef.current && firstName) {
      displayNameRef.current.value = generateDisplayName(firstName, lastName);
    }

    if (!usernameManuallyEdited && usernameRef.current && firstName) {
      const newUsername = generateUsername(firstName, lastName);
      usernameRef.current.value = newUsername;
      setUsernameValue(newUsername);

      // Debounce username check
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
      usernameCheckTimeoutRef.current = setTimeout(() => {
        checkUsernameAvailability(newUsername, editingProfile?.id);
      }, 300);
    }
  }

  function handleDisplayNameChange() {
    setDisplayNameManuallyEdited(true);
  }

  function handleUsernameChange() {
    setUsernameManuallyEdited(true);
    const username = usernameRef.current?.value || '';
    setUsernameValue(username);

    // Debounce username check
    if (usernameCheckTimeoutRef.current) {
      clearTimeout(usernameCheckTimeoutRef.current);
    }
    usernameCheckTimeoutRef.current = setTimeout(() => {
      checkUsernameAvailability(username, editingProfile?.id);
    }, 300);
  }

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    try {
      const res = await fetch('/api/profiles');
      if (!res.ok) throw new Error('Failed to fetch profiles');
      const data = await res.json();
      setProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // Auto-generate username if empty
    if (!data.username) {
      data.username = generateUsername(data.first_name as string, data.last_name as string);
    }

    // Auto-generate display_name if empty
    if (!data.display_name) {
      data.display_name = generateDisplayName(data.first_name as string, data.last_name as string);
    }

    // Validate passwords match for new profiles
    if (!editingProfile) {
      if (data.password !== data.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      // Remove confirmPassword from data sent to API
      delete data.confirmPassword;
    }

    try {
      const url = editingProfile
        ? `/api/profiles?id=${editingProfile.id}`
        : '/api/profiles';
      const method = editingProfile ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          dupr_score_singles: parseFloat(data.dupr_score_singles as string),
          dupr_score_doubles: parseFloat(data.dupr_score_doubles as string),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      setIsModalOpen(false);
      setEditingProfile(null);
      setDisplayNameManuallyEdited(false);
      setUsernameManuallyEdited(false);
      setUsernameAvailable(null);
      setUsernameValue('');
      setEmailAvailable(null);
      setEmailValue('');
      setError(null);
      fetchProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this profile?')) return;

    try {
      const res = await fetch(`/api/profiles?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete profile');
      fetchProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-red-600 text-center py-10">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Profiles</h1>
        <button
          onClick={() => {
            setEditingProfile(null);
            setDisplayNameManuallyEdited(false);
            setUsernameManuallyEdited(false);
            setUsernameAvailable(null);
            setUsernameValue('');
            setEmailAvailable(null);
            setEmailValue('');
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Add Profile
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DUPR</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{profile.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{profile.username}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{profile.display_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {profile.first_name} {profile.last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{profile.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  S: {profile.dupr_score_singles} / D: {profile.dupr_score_doubles}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      setEditingProfile(profile);
                      setIsModalOpen(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(profile.id)}
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
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingProfile ? 'Edit Profile' : 'Add Profile'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingProfile(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    ref={firstNameRef}
                    defaultValue={editingProfile?.first_name}
                    onChange={handleNameChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    ref={lastNameRef}
                    defaultValue={editingProfile?.last_name}
                    onChange={handleNameChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Display Name</label>
                  <input
                    type="text"
                    name="display_name"
                    ref={displayNameRef}
                    defaultValue={editingProfile?.display_name}
                    onChange={handleDisplayNameChange}
                    placeholder="Auto-generated from first name + last initial"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="username"
                      ref={usernameRef}
                      defaultValue={editingProfile?.username}
                      onChange={handleUsernameChange}
                      required
                      className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 pr-8 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                        usernameAvailable === false ? 'border-red-300' : usernameAvailable === true ? 'border-green-300' : 'border-gray-300'
                      }`}
                    />
                    {usernameValue && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none mt-1">
                        {checkingUsername ? (
                          <span className="text-gray-400 text-sm">...</span>
                        ) : usernameAvailable === true ? (
                          <span className="text-green-500">✓</span>
                        ) : usernameAvailable === false ? (
                          <span className="text-red-500">✗</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                  {usernameAvailable === false && (
                    <p className="mt-1 text-sm text-red-600">Username is already taken</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      ref={emailRef}
                      defaultValue={editingProfile?.email}
                      onChange={handleEmailChange}
                      required
                      className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 pr-8 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                        emailAvailable === false ? 'border-red-300' : emailAvailable === true ? 'border-green-300' : 'border-gray-300'
                      }`}
                    />
                    {emailValue && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none mt-1">
                        {checkingEmail ? (
                          <span className="text-gray-400 text-sm">...</span>
                        ) : emailAvailable === true ? (
                          <span className="text-green-500">✓</span>
                        ) : emailAvailable === false ? (
                          <span className="text-red-500">✗</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                  {emailAvailable === false && (
                    <p className="mt-1 text-sm text-red-600">Email is already in use</p>
                  )}
                </div>
                {!editingProfile && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Password</label>
                      <input
                        type="password"
                        name="password"
                        required
                        minLength={6}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Min 6 characters"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        required
                        minLength={6}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={editingProfile?.phone || ''}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    name="address"
                    defaultValue={editingProfile?.address}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Suite</label>
                  <input
                    type="text"
                    name="suite"
                    defaultValue={editingProfile?.suite || ''}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    name="city"
                    defaultValue={editingProfile?.city}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <input
                    type="text"
                    name="state"
                    defaultValue={editingProfile?.state}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ZIP</label>
                  <input
                    type="text"
                    name="zip"
                    defaultValue={editingProfile?.zip}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">DUPR Singles</label>
                  <input
                    type="number"
                    name="dupr_score_singles"
                    defaultValue={editingProfile?.dupr_score_singles || 2.0}
                    min="2.0"
                    max="8.0"
                    step="0.001"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">DUPR Doubles</label>
                  <input
                    type="number"
                    name="dupr_score_doubles"
                    defaultValue={editingProfile?.dupr_score_doubles || 2.0}
                    min="2.0"
                    max="8.0"
                    step="0.001"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">DUPR Type</label>
                  <select
                    name="dupr_type"
                    defaultValue={editingProfile?.dupr_type || 'default'}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="default">Default</option>
                    <option value="api">API</option>
                    <option value="self">Self</option>
                    <option value="instructor">Instructor</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingProfile(null);
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  {editingProfile ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
