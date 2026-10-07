import { useState, useEffect, useCallback, useRef } from 'react';

export const useAsync = (asyncFn, immediate = true, deps = [], initialData = null) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const asyncFnRef = useRef(asyncFn);
  useEffect(() => {
    asyncFnRef.current = asyncFn;
  });

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const result = await asyncFnRef.current(...args);
      setData(result);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err?.message || 'Une erreur est survenue.');
      setLoading(false);
      throw err;
    }
  }, []);

  useEffect(() => {
    if (!immediate) return;

    let ignore = false;

    Promise.resolve().then(async () => {
      if (ignore) return;
      try {
        const result = await asyncFnRef.current();
        if (!ignore) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err?.message || 'Une erreur est survenue.');
          setLoading(false);
        }
      }
    });

    return () => {
      ignore = true;
    };
  }, deps);

  return {
    data,
    loading,
    error,
    execute,
    setData,
    setError,
  };
};
