import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  REDIS_URL: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_TRUSTED_HOST: z.string().optional(),
  TRUSTED_PROXY_IP: z.string().optional(),
});

let validated = false;

export function validateEnv() {
  if (validated) return;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`,
    );
    throw new Error(`Environment validation failed:\n${errors.join("\n")}`);
  }
  validated = true;
}

export const env = {
  get DATABASE_URL() {
    validateEnv();
    return process.env.DATABASE_URL!;
  },
  get AUTH_SECRET() {
    validateEnv();
    return process.env.AUTH_SECRET!;
  },
  get REDIS_URL() {
    validateEnv();
    return process.env.REDIS_URL;
  },
  get NEXTAUTH_URL() {
    return process.env.NEXTAUTH_URL;
  },
  get NEXTAUTH_TRUSTED_HOST() {
    return process.env.NEXTAUTH_TRUSTED_HOST;
  },
  get TRUSTED_PROXY_IP() {
    return process.env.TRUSTED_PROXY_IP;
  },
};
