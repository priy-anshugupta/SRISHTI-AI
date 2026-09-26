'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type NetworkMode = 'cloud' | 'edge';

interface NetworkModeContextType {
  networkMode: NetworkMode;
  setNetworkMode: (mode: NetworkMode) => void;
  toggleNetworkMode: () => void;
  isAirGapped: boolean;
  modelDisplayName: string;
  providerBadge: string;
}

const NetworkModeContext = createContext<NetworkModeContextType | undefined>(undefined);

const STORAGE_KEY = 'srishti_network_mode';

export function NetworkModeProvider({ children }: { children: ReactNode }) {
  const [networkMode, setNetworkModeState] = useState<NetworkMode>('cloud');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as NetworkMode | null;
      if (saved === 'cloud' || saved === 'edge') {
        setNetworkModeState(saved);
      }
    } catch {
      // Ignore localStorage access restrictions
    }
  }, []);

  const setNetworkMode = (mode: NetworkMode) => {
    setNetworkModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Ignore
    }
  };

  const toggleNetworkMode = () => {
    setNetworkMode(networkMode === 'cloud' ? 'edge' : 'cloud');
  };

  const isAirGapped = networkMode === 'edge';
  const modelDisplayName = isAirGapped 
    ? 'Local Ollama (qwen2.5:7b) · Zero-Cloud Air-Gap' 
    : 'Groq Cloud (Qwen 3.8 27B)';
  const providerBadge = isAirGapped ? 'SOVEREIGN RIG EDGE' : 'GROQ CLOUD';

  return (
    <NetworkModeContext.Provider
      value={{
        networkMode,
        setNetworkMode,
        toggleNetworkMode,
        isAirGapped,
        modelDisplayName,
        providerBadge,
      }}
    >
      {children}
    </NetworkModeContext.Provider>
  );
}

export function useNetworkMode() {
  const context = useContext(NetworkModeContext);
  if (!context) {
    throw new Error('useNetworkMode must be used within a NetworkModeProvider');
  }
  return context;
}
