'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  department: string;
  badge: string;
  initials: string;
  avatarColor: string;
  clearanceLevel: string;
  email: string;
}

export const PRESET_PERSONAS: UserProfile[] = [
  {
    id: 'user_saikia',
    name: 'P. Saikia',
    role: 'Drilling Engineer',
    department: 'Headquarters (Duliajan)',
    badge: 'Planning',
    initials: 'PS',
    avatarColor: 'bg-brand text-accent border-accent/50',
    clearanceLevel: 'Planning & Analysis',
    email: 'p.saikia@oilindia.in'
  },
  {
    id: 'user_kumar',
    name: 'Rajesh Kumar',
    role: 'Operations Manager',
    department: 'Field Operations (Moran)',
    badge: 'Operations',
    initials: 'RK',
    avatarColor: 'bg-danger-soft text-danger border-danger/25',
    clearanceLevel: 'Full Operations',
    email: 'rajesh.kumar@oilindia.in'
  },
  {
    id: 'user_sarma',
    name: 'K. Sarma',
    role: 'Rig Supervisor',
    department: 'Active Rig (OIL-RIG-04)',
    badge: 'Rig Floor',
    initials: 'KS',
    avatarColor: 'bg-warning-soft text-warning border-warning/25',
    clearanceLevel: 'Rig Floor View',
    email: 'k.sarma@oilindia.in'
  },
  {
    id: 'user_bordoloi',
    name: 'Dr. M. Bordoloi',
    role: 'Safety Auditor',
    department: 'Safety Directorate (OISD)',
    badge: 'Safety Audit',
    initials: 'MB',
    avatarColor: 'bg-accent-soft text-accent border-accent/25',
    clearanceLevel: 'Compliance Audit',
    email: 'm.bordoloi@oisd.gov.in'
  }
];

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userProfile: UserProfile, redirectTo?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'srishti_auth_user_v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load auth state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) {
          setUser(parsed);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (userProfile: UserProfile, redirectTo?: string) => {
    setUser(userProfile);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
    } catch {
      // ignore
    }
    if (redirectTo) {
      router.push(redirectTo);
    } else {
      router.push('/map');
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
