"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAccount } from "wagmi";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const isGameRoute = pathname === "/game" || pathname.startsWith("/game/");

  // Handle the actual redirect in a separate effect
  useEffect(() => {
    if (shouldRedirect) {
      router.push("/");
    }
  }, [shouldRedirect, router]);

  useEffect(() => {
    // Reset state when connection status changes
    if (isConnected) {
      setRedirectCountdown(5);
      setShouldRedirect(false);
      return;
    }

    // Only show toast notification if NOT on game route
    // if (!isGameRoute) {
    //   notification.warning(
    //     <div className="flex flex-col gap-1">
    //       <p className="my-0 font-bold">Wallet Not Connected</p>
    //       <p className="my-0">Please connect your wallet to continue</p>
    //     </div>,
    //     { duration: 5000 },
    //   );
    // }

    // Countdown timer
    const timer = setInterval(() => {
      setRedirectCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setShouldRedirect(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isConnected, isGameRoute]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className="bg-[#1a1c2c] p-8 rounded-lg border-2 border-[#c6c607] shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-[#c6c607] mb-4">Wallet Connection Required</h2>
          <p className="text-white mb-6">Please connect your wallet to access this page</p>

          <div className="animate-pulse mb-4">
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
              className="mx-auto"
            >
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
              <path d="M18 12h.01"></path>
            </svg>
          </div>

          <div className="mt-4">
            <p className="text-white">Redirecting in {redirectCountdown} seconds...</p>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mt-3">
              <div
                className="bg-[#c6c607] h-2.5 rounded-full transition-all duration-1000"
                style={{ width: `${(redirectCountdown / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
