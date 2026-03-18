import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/auth";

export const SURVEY_KEY = "alpha-feedback-1";
export const SURVEY_REWARD_CREDITS = 10;

export async function getCurrentSurveyStatus() {
  const actor = await getCurrentActor();

  const existingByBucket = await prisma.surveyResponse.findUnique({
    where: {
      surveyKey_bucketKey: {
        surveyKey: SURVEY_KEY,
        bucketKey: actor.bucketKey,
      },
    },
  });

  const existingByUser = actor.isGuest
    ? null
    : await prisma.surveyResponse.findFirst({
        where: {
          surveyKey: SURVEY_KEY,
          userId: actor.user.id,
        },
      });

  const existing = existingByBucket || existingByUser;

  return {
    actor,
    alreadySubmitted: Boolean(existing),
    submittedAt: existing?.createdAt ?? null,
    rewardCredits: SURVEY_REWARD_CREDITS,
  };
}
