'use client'

import { useAuth } from '@/context/AuthContext'

export function useProfile() {
  const { profile, refreshProfile, loading } = useAuth()

  return {
    profile,
    refreshProfile,
    loading,
    fullName: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '',
    initials: profile
      ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase()
      : '',
  }
}
