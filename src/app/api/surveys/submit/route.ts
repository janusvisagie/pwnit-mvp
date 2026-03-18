export const runtime = "nodejs";

import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/auth";
import { SURVEY_KEY, SURVEY_REWARD_CREDITS } from "@/lib/survey";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const overall = Number((body as { overall?: unknown })?.overall ?? 0);
    const favorite = String((body as { favorite?: unknown })?.favorite ?? "").trim();
    const improve = String((body as { improve?: unknown })?.improve ?? "").trim();
    const nextPrize = String((body as { nextPrize?: unknown })?.nextPrize ?? "").trim();
    const contactOk = Boolean((body as { contactOk?: unknown })?.contactOk);

    if (!Number.isFinite(overall) || overall < 1 || overall > 5) {
      return NextResponse.json(
        { ok: false, error: "Please choose an overall score from 1 to 5." },
        { status: 400 },
      );
    }

    if (improve.length < 12) {
      return NextResponse.json(
        { ok: false, error: "Please add a little more detail in the suggestions box." },
        { status: 400 },
      );
    }

    const actor = await getCurrentActor();

    const existingByBucket = await prisma.surveyResponse.findUnique({
      where: {
        surveyKey_bucketKey: {
          surveyKey: SURVEY_KEY,
          bucketKey: actor.bucketKey,
        },
      },
      select: { id: true },
    });

    const existingByUser = actor.isGuest
      ? null
      : await prisma.surveyResponse.findFirst({
          where: {
            surveyKey: SURVEY_KEY,
            userId: actor.user.id,
          },
          select: { id: true },
        });

    if (existingByBucket || existingByUser) {
      return NextResponse.json(
        { ok: false, error: "This feedback reward has already been claimed for this survey." },
        { status: 409 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.surveyResponse.create({
        data: {
          surveyKey: SURVEY_KEY,
          userId: actor.isGuest ? null : actor.user.id,
          bucketKey: actor.bucketKey,
          answersJson: {
            overall,
            favorite,
            improve,
            nextPrize,
            contactOk,
          },
          rewardCredits: SURVEY_REWARD_CREDITS,
          rewardedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: actor.user.id },
        data: {
          freeCreditsBalance: { increment: SURVEY_REWARD_CREDITS },
        },
      });

      await tx.creditLedger.create({
        data: {
          userId: actor.user.id,
          kind: "SURVEY_BONUS",
          credits: SURVEY_REWARD_CREDITS,
          note: "Feedback reward for completing the alpha suggestions survey.",
        },
      });
    });

    return NextResponse.json({
      ok: true,
      rewardCredits: SURVEY_REWARD_CREDITS,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "This feedback reward has already been claimed for this survey." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not submit feedback right now.",
      },
      { status: 500 },
    );
  }
}
