import { db } from "@/lib/db";
import { users, refreshTokens } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { redis } from "@/lib/redis";
import type { User, NewUser } from "@/lib/schema";

const SALT_ROUNDS = 10;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export async function createUser(data: {
  email: string;
  name: string;
  password: string;
}): Promise<User> {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, data.email),
  });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const result = await db
    .insert(users)
    .values({
      email: data.email,
      name: data.name,
      password: hashedPassword,
    })
    .returning();

  return result[0];
}

export async function validateUser(
  email: string,
  password: string,
): Promise<User | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user || !user.isActive) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return null;
  }

  return user;
}

export async function createRefreshToken(userId: number): Promise<string> {
  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await db.insert(refreshTokens).values({
    userId,
    token,
    expiresAt,
  });

  await redis.setex(
    `refresh:${token}`,
    REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
    userId.toString(),
  );

  return token;
}

export async function validateRefreshToken(
  token: string,
): Promise<User | null> {
  const cachedUserId = await redis.get(`refresh:${token}`);

  if (cachedUserId) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, parseInt(cachedUserId, 10)),
    });
    if (user && user.isActive) {
      return user;
    }
    return null;
  }

  const storedToken = await db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.token, token),
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    return null;
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, storedToken.userId),
  });

  if (!user || !user.isActive) {
    return null;
  }

  await redis.setex(
    `refresh:${token}`,
    REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
    user.id.toString(),
  );

  return user;
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
  await redis.del(`refresh:${token}`);
}

export async function revokeAllUserTokens(userId: number): Promise<void> {
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));

  const keys = await redis.keys(`refresh:*`);
  if (keys.length > 0) {
    const userIdStr = userId.toString();
    const tokensToDelete = await Promise.all(
      keys.map(async (key) => {
        const storedUserId = await redis.get(key);
        return storedUserId === userIdStr ? key : null;
      }),
    );
    await Promise.all(
      tokensToDelete.filter(Boolean).map((key) => redis.del(key!)),
    );
  }
}

export async function getUsers(): Promise<User[]> {
  return db.select().from(users);
}

export async function getUserById(id: number): Promise<User | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  });
  return user ?? null;
}

export async function updateUser(
  id: number,
  data: Partial<Pick<User, "name" | "role" | "isActive">>,
): Promise<User> {
  const result = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  if (!result[0]) {
    throw new Error("User not found");
  }

  return result[0];
}

export async function deleteUser(id: number): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
}
