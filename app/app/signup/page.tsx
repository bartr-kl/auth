'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    first_name: '',
    last_name: '',
    display_name: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Debounced username availability check
  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (!username || username.length < 2) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const res = await fetch(`/api/profiles/check-username?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      setUsernameAvailable(data.available);
    } catch (err) {
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  }, []);

  // Debounced email availability check
  const checkEmailAvailability = useCallback(async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailAvailable(null);
      return;
    }

    setCheckingEmail(true);
    try {
      const res = await fetch(`/api/profiles/check-email?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setEmailAvailable(data.available);
    } catch (err) {
      setEmailAvailable(null);
    } finally {
      setCheckingEmail(false);
    }
  }, []);

  // Debounce the username check
  useEffect(() => {
    const timer = setTimeout(() => {
      checkUsernameAvailability(formData.username);
    }, 300);
    return () => clearTimeout(timer);
  }, [formData.username, checkUsernameAvailability]);

  // Debounce the email check
  useEffect(() => {
    const timer = setTimeout(() => {
      checkEmailAvailability(formData.email);
    }, 300);
    return () => clearTimeout(timer);
  }, [formData.email, checkEmailAvailability]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Auto-generate display_name and username when first or last name changes
      if (name === 'first_name' || name === 'last_name') {
        const firstName = name === 'first_name' ? value : prev.first_name;
        const lastName = name === 'last_name' ? value : prev.last_name;

        // Update display_name if it matches the previously generated value
        const previousGenerated = generateDisplayName(prev.first_name, prev.last_name);
        if (prev.display_name === '' || prev.display_name === previousGenerated) {
          updated.display_name = generateDisplayName(firstName, lastName);
        }

        // Update username if it matches the previously generated value
        const previousUsername = generateUsername(prev.first_name, prev.last_name);
        if (prev.username === '' || prev.username === previousUsername) {
          updated.username = generateUsername(firstName, lastName);
        }
      }
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Use the API route to create auth user and profile together
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          first_name: formData.first_name,
          last_name: formData.last_name,
          display_name: formData.display_name || generateDisplayName(formData.first_name, formData.last_name),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create account');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-8 rounded-md">
            <h2 className="text-xl font-semibold mb-2">Check your email</h2>
            <p className="text-sm">
              We&apos;ve sent you a confirmation email. Please click the link to verify your account.
            </p>
          </div>
          <Link href="/login" className="text-indigo-600 hover:text-indigo-500">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">
                Display Name
              </label>
              <input
                id="display_name"
                name="display_name"
                type="text"
                value={formData.display_name}
                onChange={handleChange}
                placeholder="Auto-generated from first name + last initial"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    usernameAvailable === false ? 'border-red-300' : usernameAvailable === true ? 'border-green-300' : 'border-gray-300'
                  }`}
                />
                {formData.username && (
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    emailAvailable === false ? 'border-red-300' : emailAvailable === true ? 'border-green-300' : 'border-gray-300'
                  }`}
                />
                {formData.email && (
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
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
