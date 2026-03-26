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

export async function consumeRateLimit({ scope, subject, limit, windowMs }: ConsumeOptions): Promise<ConsumeResult> {
  const now = Date.now();
  const bucketStart = now - (now % windowMs);
  const windowStart = new Date(bucketStart);
  const expiresAt = new Date(bucketStart + windowMs * 2);
  const key = hashForRateLimit(`${scope}:${subject}:${bucketStart}`);

  const result = await prisma.$transaction(async (tx) => {
    const existing = await (tx as any).apiRateLimit.findUnique({ where: { key } });

    if (!existing) {
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
    }

    const nextCount = Number(existing.count || 0) + 1;
    if (nextCount > limit) {
      return { count: Number(existing.count || 0), blocked: true as const };
    }

    await (tx as any).apiRateLimit.update({
      where: { key },
      data: {
        count: { increment: 1 },
        expiresAt,
      },
    });

    return { count: nextCount };
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
