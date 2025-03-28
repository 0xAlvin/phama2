import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;

export const authOptions = {
  callbacks: {
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      } else if (new URL(url).origin === baseUrl) {
        return url;
      }
      return `${baseUrl}/dashboard`;
    },
  },
};
