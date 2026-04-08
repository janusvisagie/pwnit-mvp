import { prisma } from "@/lib/db";
import { hashForRateLimit } from "@/lib/auth";

type ConsumeOptions = {
  scope: string;
  subject: string;
  limit: number;
  windowMs: number;
};

type ConsumeResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002",
  );
}

export async function consumeRateLimit({
  scope,
  subject,
  limit,
  windowMs,
}: ConsumeOptions): Promise<ConsumeResult> {
  const now = Date.now();
  const bucketStart = now - (now % windowMs);
  const windowStart = new Date(bucketStart);
  const expiresAt = new Date(bucketStart + windowMs * 2);
  const key = hashForRateLimit(`${scope}:${subject}:${bucketStart}`);

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const existing = await (prisma as any).apiRateLimit.findUnique({ where: { key } });

    if (!existing) {
      try {
        await (prisma as any).apiRateLimit.create({
          data: {
            key,
            scope,
            subjectKey: subject,
            windowStart,
            count: 1,
            expiresAt,
          },
        });

        return {
          ok: true,
          remaining: Math.max(0, limit - 1),
          retryAfterSeconds: Math.max(1, Math.ceil((bucketStart + windowMs - now) / 1000)),
        };
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          continue;
        }
        throw error;
      }
    }

    const currentCount = Number(existing.count || 0);
    const retryAfterSeconds = Math.max(1, Math.ceil((bucketStart + windowMs - now) / 1000));
    if (currentCount >= limit) {
      return {
        ok: false,
        remaining: 0,
        retryAfterSeconds,
      };
    }

    const updated = await (prisma as any).apiRateLimit.updateMany({
      where: {
        key,
        count: currentCount,
      },
      data: {
        count: { increment: 1 },
        expiresAt,
      },
    });

    if (Number(updated?.count || 0) === 1) {
      return {
        ok: true,
        remaining: Math.max(0, limit - (currentCount + 1)),
        retryAfterSeconds,
      };
    }
  }

  throw new Error("Rate limit contention. Please retry.");
}
