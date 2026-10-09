'use client';

import { useEffect } from 'react';
import { startVisiblePolling } from './visiblePolling';

export function useDashboardPolling(
  poll: (signal: AbortSignal) => Promise<void>,
  intervalMs: number,
  enabled: boolean,
  routeKey = '',
) {
  useEffect(() => {
    if (!enabled) return;
    return startVisiblePolling(poll, intervalMs);
  }, [poll, intervalMs, enabled, routeKey]);
}
