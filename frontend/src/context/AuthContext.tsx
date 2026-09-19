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
    role: 'Lead Drilling Engineer',
    department: 'Subsurface Intelligence · Duliajan HQ',
    badge: 'OIL-DE-104',
    initials: 'PS',
    avatarColor: 'bg-[#0D5C75] text-[#38BDF8] border-[#38BDF8]/50',
    clearanceLevel: 'LEVEL 4 · FULL SUBSURFACE ACCESS',
    email: 'p.saikia@oilindia.in'
  },
  {
    id: 'user_kumar',
    name: 'Rajesh Kumar',
    role: 'Chief Drilling Superintendent',
    department: 'Lead Company Man · Oil India Ltd',
    badge: 'OIL-CMD-04',
    initials: 'RK',
    avatarColor: 'bg-red-950 text-red-300 border-red-700',
    clearanceLevel: 'LEVEL 5 · STOP WORK AUTHORITY (SWA)',
    email: 'rajesh.kumar@oilindia.in'
  },
  {
    id: 'user_sarma',
    name: 'K. Sarma',
    role: 'Rig Floor Toolpusher',
    department: 'OIL-RIG-04 · Moran Asset',
    badge: 'OIL-RIG-8429',
    initials: 'KS',
    avatarColor: 'bg-amber-950 text-amber-300 border-amber-700',
    clearanceLevel: 'LEVEL 3 · RIG TERMINAL & SOP EXECUTION',
    email: 'k.sarma@oilindia.in'
  },
  {
    id: 'user_bordoloi',
    name: 'Dr. M. Bordoloi',
    role: 'Senior Regulatory Inspector',
    department: 'Oil Industry Safety Directorate (OISD)',
    badge: 'OISD-INSP-204',
    initials: 'MB',
    avatarColor: 'bg-purple-950 text-purple-300 border-purple-700',
    clearanceLevel: 'LEVEL 4 · STATUTORY AUDIT & COMPLIANCE',
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
