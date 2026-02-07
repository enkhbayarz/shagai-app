const domain = process.env.CLERK_JWT_ISSUER_DOMAIN;

if (!domain) {
  console.warn(
    "Warning: CLERK_JWT_ISSUER_DOMAIN environment variable is not set. " +
    "Run: npx convex env set CLERK_JWT_ISSUER_DOMAIN <your-clerk-domain>"
  );
}

export default {
  providers: [
    {
      domain,
      applicationID: "convex",
    },
  ],
};
