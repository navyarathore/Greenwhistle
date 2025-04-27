// app/components/LoadingProvider.tsx
"use client";

import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Loader from "./Loader";

// app/components/LoadingProvider.tsx

// app/components/LoadingProvider.tsx

// app/components/LoadingProvider.tsx

// app/components/LoadingProvider.tsx

// app/components/LoadingProvider.tsx

// app/components/LoadingProvider.tsx

// app/components/LoadingProvider.tsx

// app/components/LoadingProvider.tsx

// app/components/LoadingProvider.tsx

// app/components/LoadingProvider.tsx

type LoadingContextType = {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
};

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Auto-detect navigation and show loader
  useEffect(() => {
    setIsLoading(true);

    // Simulate minimum load time for better UX (remove if not needed)
    const minLoadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(minLoadingTimer);
  }, [pathname, searchParams]);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading: setIsLoading }}>
      {isLoading && <Loader />}
      {children}
    </LoadingContext.Provider>
  );
}

// Custom hook to use the loading context
export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};
