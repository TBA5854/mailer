export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/batches/:path*",
    "/senders/:path*",
    "/templates/:path*",
    "/onboarding/:path*",
    "/faq/:path*",
  ],
};
