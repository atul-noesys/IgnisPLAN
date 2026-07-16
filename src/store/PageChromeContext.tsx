import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type PageChromeState = {
  title: string;
  subtitle?: string;
  headerStatsHtml?: string;
  actions?: ReactNode;
};

type PageChromeContextValue = PageChromeState & {
  setChrome: (next: Partial<PageChromeState>) => void;
  resetChrome: () => void;
};

const defaults: PageChromeState = {
  title: "IgnisPLAN",
  subtitle: "",
  headerStatsHtml: "",
  actions: null,
};

const PageChromeContext = createContext<PageChromeContextValue | null>(null);

export function PageChromeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PageChromeState>(defaults);

  const setChrome = useCallback((next: Partial<PageChromeState>) => {
    setState((prev) => ({ ...prev, ...next }));
  }, []);

  const resetChrome = useCallback(() => {
    setState(defaults);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      setChrome,
      resetChrome,
    }),
    [state, setChrome, resetChrome],
  );

  return (
    <PageChromeContext.Provider value={value}>{children}</PageChromeContext.Provider>
  );
}

export function usePageChrome() {
  const ctx = useContext(PageChromeContext);
  if (!ctx) throw new Error("usePageChrome requires PageChromeProvider");
  return ctx;
}
