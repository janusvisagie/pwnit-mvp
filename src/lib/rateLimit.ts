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

  const result = await prisma.$transaction(async (tx) => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const existing = await (tx as any).apiRateLimit.findUnique({ where: { key } });

      if (!existing) {
        try {
          await (tx as any).apiRateLimit.create({
            data: {
              key,
              scope,
              subjectKey: subject,
              windowStart,
              count: 1,
              expiresAt,
            },
          });
          return { count: 1 };
        } catch (error) {
          if (isUniqueConstraintError(error)) {
            continue;
          }
          throw error;
        }
      }

      const currentCount = Number(existing.count || 0);
      if (currentCount >= limit) {
        return { count: currentCount, blocked: true as const };
      }

      const updated = await (tx as any).apiRateLimit.updateMany({
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
        return { count: currentCount + 1 };
      }
    }

    throw new Error("Rate limit contention. Please retry.");
  });

  const retryAfterSeconds = Math.max(1, Math.ceil((bucketStart + windowMs - now) / 1000));
  const currentCount = Number((result as any).count || 0);
  const blocked = Boolean((result as any).blocked);

  return {
    ok: !blocked,
    remaining: Math.max(0, limit - currentCount),
    retryAfterSeconds,
  };
}
