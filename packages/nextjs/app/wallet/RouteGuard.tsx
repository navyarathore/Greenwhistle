// ~~/components/wallet/RouteGuard.tsx
"use client";

import { useEffect } from "react";
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

// List of routes that require wallet connection
const protectedRoutes = ["/game", "/marketplace", "/recipes"];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isProtectedRoute = protectedRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));

    if (isProtectedRoute && !isConnected) {
      notification.warning(
        <div className="flex flex-col gap-1">
          <p className="my-0 font-bold">Wallet Not Connected</p>
          <p className="my-0">Please connect your wallet to access this page</p>
        </div>,
        { duration: 5000 },
      );
      router.push("/");
    }
  }, [isConnected, pathname, router]);

  return <>{children}</>;
}
