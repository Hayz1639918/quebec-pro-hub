import { lazy, type ComponentType } from "react";

/**
 * Guard key shared between the lazy wrapper and the global vite:preloadError
 * handler so that we only ever force a single automatic reload per session.
 */
export const CHUNK_RELOAD_KEY = "bn:chunk-reloaded";

/**
 * React.lazy wrapper that self-heals stale deployments.
 *
 * When a new version is deployed, the asset file names (content hashes) change.
 * A browser that still holds an older index.html in cache will try to import a
 * chunk that no longer exists, which makes the dynamic import hang or reject and
 * leaves the user stuck on the loading spinner. When that happens we reload the
 * page exactly once to fetch the fresh index.html and matching chunks. The
 * sessionStorage guard prevents an infinite reload loop on a genuinely broken
 * build (in that case the error is surfaced to the ErrorBoundary instead).
 */
export function lazyWithReload<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      // Successful load means the deployment is consistent again.
      try {
        sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      } catch {
        /* sessionStorage may be unavailable (private mode quirks) */
      }
      return mod;
    } catch (err) {
      let alreadyReloaded = false;
      try {
        alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1";
        if (!alreadyReloaded) sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
      } catch {
        /* ignore storage errors */
      }

      if (!alreadyReloaded) {
        window.location.reload();
        // Keep the Suspense fallback visible during reload instead of throwing.
        return new Promise<{ default: T }>(() => {});
      }

      // We already reloaded once and the chunk still fails: surface the error.
      throw err;
    }
  });
}
