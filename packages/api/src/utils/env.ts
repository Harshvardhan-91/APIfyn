// Environment variables configuration for production deployment

// This file helps ensure the DATABASE_URL has the correct SSL settings for hosted PostgreSQL

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "postgres"]);

export function getDatabaseUrl(): string {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Respect an explicit SSL setting (e.g. sslmode=disable)
  if (/[?&](sslmode|ssl)=/.test(dbUrl)) {
    return dbUrl;
  }

  // Local Docker Postgres doesn't serve TLS
  try {
    if (LOCAL_HOSTS.has(new URL(dbUrl).hostname)) {
      return dbUrl;
    }
  } catch {
    // Fall through and let Prisma report the malformed URL
  }

  // Hosted Postgres (Supabase, Render) requires SSL
  const separator = dbUrl.includes("?") ? "&" : "?";
  return `${dbUrl}${separator}sslmode=require&ssl=true`;
}

export function getEnvironmentConfig() {
  return {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: process.env.PORT || 5000,
    DATABASE_URL: getDatabaseUrl(),
    // Add other environment variables as needed
  };
}
