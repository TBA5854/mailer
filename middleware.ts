import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: [
    "/batches/:path*",
    "/senders/:path*",
    "/templates/:path*",
    "/onboarding/:path*",
    "/faq/:path*",
  ],
};
