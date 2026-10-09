export const TELEMETRY_POLL_MS = 30_000;
export const ALERTS_POLL_MS = 60_000;

/** One request at a time; a slow Render cold start never queues more requests. */
export function startVisiblePolling(
  poll: (signal: AbortSignal) => Promise<void>,
  intervalMs: number,
) {
  let stopped = false;
  let pageActive = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;

  const pause = () => {
    clearTimeout(timer);
    timer = undefined;
    controller?.abort();
    controller = undefined;
  };

  const run = async () => {
    if (stopped || !pageActive || document.visibilityState !== 'visible' || controller) return;
    const request = new AbortController();
    controller = request;
    try {
      await poll(request.signal);
    } catch {
      // The caller handles errors. Retry at the normal interval, including cold starts.
    } finally {
      if (controller === request) controller = undefined;
      if (!stopped && !request.signal.aborted && pageActive && document.visibilityState === 'visible') {
        timer = setTimeout(() => void run(), intervalMs);
      }
    }
  };

  const onVisibilityChange = () => {
    pause();
    if (document.visibilityState === 'visible') void run();
  };
  const onPageHide = () => {
    pageActive = false;
    pause();
  };
  const onPageShow = () => {
    pageActive = true;
    void run();
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('pageshow', onPageShow);
  void run();

  return () => {
    stopped = true;
    pause();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('pagehide', onPageHide);
    window.removeEventListener('pageshow', onPageShow);
  };
}
