// ~~/components/wallet/ProtectedRoute.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";

// ~~/components/wallet/ProtectedRoute.tsx

// ~~/components/wallet/ProtectedRoute.tsx

// ~~/components/wallet/ProtectedRoute.tsx

// ~~/components/wallet/ProtectedRoute.tsx

// ~~/components/wallet/ProtectedRoute.tsx

// ~~/components/wallet/ProtectedRoute.tsx

// ~~/components/wallet/ProtectedRoute.tsx

// ~~/components/wallet/ProtectedRoute.tsx

// ~~/components/wallet/ProtectedRoute.tsx

// ~~/components/wallet/ProtectedRoute.tsx

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) {
      notification.warning(
        <div className="flex flex-col gap-1">
          <p className="my-0 font-bold">Wallet Not Connected</p>
          <p className="my-0">Please connect your wallet to continue</p>
        </div>,
        { duration: 5000 },
      );
      router.push("/");
    }
  }, [isConnected, router]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className="bg-[#1a1c2c] p-8 rounded-lg border-2 border-[#c6c607] shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-[#c6c607] mb-4">Wallet Connection Required</h2>
          <p className="text-white mb-6">Please connect your wallet to access this page</p>
          <div className="animate-pulse">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#c6c607"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto mb-4"
            >
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
              <path d="M18 12h.01"></path>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
