import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Store } from "@/lib/prototype";

type StoreContextValue = {
  version: number;
  refresh: () => void;
  reset: () => void;
  getStore: () => typeof Store;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  const reset = useCallback(() => {
    Store.reset();
    setVersion((v) => v + 1);
  }, []);

  const value = useMemo(
    () => ({
      version,
      refresh,
      reset,
      getStore: () => Store,
    }),
    [version, refresh, reset],
  );

  // Ensure seed is loaded once
  Store.getAll();

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useAppStore must be used within StoreProvider");
  }
  return ctx;
}
