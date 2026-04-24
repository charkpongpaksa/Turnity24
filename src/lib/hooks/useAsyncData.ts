import { DependencyList, useEffect, useState } from "react";

type AsyncDataState<T> = {
  data: T | null;
  error: Error | null;
  loading: boolean;
};

export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: DependencyList
): AsyncDataState<T> {
  const [state, setState] = useState<AsyncDataState<T>>({
    data: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let isActive = true;

    setState((prev) => ({
      data: prev.data,
      error: null,
      loading: true,
    }));

    loader()
      .then((data) => {
        if (!isActive) return;
        setState({
          data,
          error: null,
          loading: false,
        });
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        setState({
          data: null,
          error: error instanceof Error ? error : new Error("Unknown error"),
          loading: false,
        });
      });

    return () => {
      isActive = false;
    };
  }, deps);

  return state;
}
