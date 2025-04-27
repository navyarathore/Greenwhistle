// ~~/components/wallet/RouteGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";

// ~~/components/wallet/RouteGuard.tsx

// ~~/components/wallet/RouteGuard.tsx

// ~~/components/wallet/RouteGuard.tsx

// ~~/components/wallet/RouteGuard.tsx

// ~~/components/wallet/RouteGuard.tsx

// ~~/components/wallet/RouteGuard.tsx

// ~~/components/wallet/RouteGuard.tsx

// ~~/components/wallet/RouteGuard.tsx

// ~~/components/wallet/RouteGuard.tsx

// ~~/components/wallet/RouteGuard.tsx

const protectedRoutes = ["/game", "/marketplace", "/recipes"];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const isGameRoute = pathname === "/game" || pathname.startsWith("/game/");

  useEffect(() => {
    const isProtectedRoute = protectedRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));

    if (isProtectedRoute && !isConnected) {
      // Only show toast notification if NOT on game route
      if (!isGameRoute) {
        notification.warning(
          <div className="flex flex-col gap-1">
            <p className="my-0 font-bold">Wallet Not Connected</p>
            <p className="my-0">Please connect your wallet to access this page</p>
          </div>,
          { duration: 7000 },
        );
      }

      setIsRedirecting(true);

      // Add a 5-second delay before redirect
      const redirectTimer = setTimeout(() => {
        router.push("/");
        setIsRedirecting(false);
      }, 5000);

      return () => clearTimeout(redirectTimer);
    }
  }, [isConnected, pathname, router, isGameRoute]);

  return <>{children}</>;
}
