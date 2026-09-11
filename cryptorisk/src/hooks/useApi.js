import { useState, useEffect, useCallback } from 'react';

/**
 * useApi(fetchFn, deps)
 *
 * Generic data-fetching hook.
 * @param {Function} fetchFn  — async function that returns data
 * @param {Array}    deps     — re-fetch when these change
 * @returns {{ data, loading, error, refetch }}
 *
 * Usage:
 *   const { data, loading, error } = useApi(() => portfolio.summary(portfolioId), [portfolioId]);
 */
export default function useApi(fetchFn, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { execute(); }, [execute]);

  return { data, loading, error, refetch: execute };
}
