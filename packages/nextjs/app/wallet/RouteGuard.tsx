"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";

const protectedRoutes = ["/game", "/marketplace", "/recipes"];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const isGameRoute = pathname === "/game" || pathname.startsWith("/game/");
  const isProtectedRoute = protectedRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));

  // Handle the actual redirect in a separate effect
  useEffect(() => {
    if (shouldRedirect) {
      router.push("/");
      setShouldRedirect(false);
    }
  }, [shouldRedirect, router]);

  useEffect(() => {
    if (isProtectedRoute && !isConnected) {
      // Only show toast notification if NOT on game route
      // if (!isGameRoute) {
      //   notification.warning(
      //     <div className="flex flex-col gap-1">
      //       <p className="my-0 font-bold">Wallet Not Connected</p>
      //       <p className="my-0">Please connect your wallet to access this page</p>
      //     </div>,
      //     { duration: 7000 },
      //   );
      // }

      // Add a 5-second delay before setting redirect flag
      const redirectTimer = setTimeout(() => {
        setShouldRedirect(true);
      }, 5000);

      return () => clearTimeout(redirectTimer);
    }
  }, [isConnected, pathname, isGameRoute, isProtectedRoute]);

  return <>{children}</>;
}
