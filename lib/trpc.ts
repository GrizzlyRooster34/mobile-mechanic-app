import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // Production API URL
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  // Development fallback
  if (__DEV__) {
    return 'http://localhost:3000'; // Local development server
  }

  throw new Error(
    "No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL"
  );
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      // Add headers for production
      headers: () => {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        // Add API key for production if available
        if (process.env.EXPO_PUBLIC_API_KEY) {
          headers['Authorization'] = `Bearer ${process.env.EXPO_PUBLIC_API_KEY}`;
        }

        // Add environment header
        headers['X-Environment'] = __DEV__ ? 'development' : 'production';

        return headers;
      },
    }),
  ],
});