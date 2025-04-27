// app/components/Loader.tsx
"use client";

import { useEffect, useState } from "react";

// app/components/Loader.tsx

// app/components/Loader.tsx

// app/components/Loader.tsx

// app/components/Loader.tsx

// app/components/Loader.tsx

// app/components/Loader.tsx

// app/components/Loader.tsx

// app/components/Loader.tsx

// app/components/Loader.tsx

// app/components/Loader.tsx

export default function Loader() {
  const [dots, setDots] = useState(1);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    // Animate dots
    const dotsInterval = setInterval(() => {
      setDots(prev => (prev === 3 ? 1 : prev + 1));
    }, 400);

    // Minimum display time (3 seconds)
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 3000);

    return () => {
      clearInterval(dotsInterval);
      clearTimeout(timer);
    };
  }, []);

  if (!showLoader) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1b1b1b] backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <div className="relative h-20 w-20 mb-4">
          {/* Outer spinning circle */}
          <div className="absolute inset-0 border-4 border-green-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-green-600 border-r-green-600 rounded-full animate-spin"></div>

          {/* Inner circle with wheat icon */}
          <div className="absolute inset-3 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#15803d"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8"
            >
              <path d="M12 2c1.2 1.3 1.1 5.6-1.2 6.4 0-1.3-.7-5.1.1-5.5.1 1.8.1 4.9 2.7 8.2C16 14.7 12 18 10 18c-2.5 0-3.5-6.9-1.1-8.4C11.9 8.3 13.7 10 14 12c.8-2.6-.9-5.5-2-8z"></path>
              <path d="M20 12c-1.3 1.5-5.5 1.7-6.5-.5 1.4-.1 5.1-1 5.4-.1-1.9.1-5 .2-8.4 2.5C7 16.3 4 12 4 10c0-2.5 6.7-3.8 8.5-1.5C14 10.7 12.5 12.3 10.5 12.7c2.7.8 5.5-.6 7.5-2"></path>
              <path d="M12 22V12"></path>
            </svg>
          </div>
        </div>

        {/* Text with animated dots */}
        <p className="text-green-800 font-medium text-lg">Green Whistle Loading{".".repeat(dots)}</p>
      </div>
    </div>
  );
}
