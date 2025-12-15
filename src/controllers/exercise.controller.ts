import { prisma} from "../prisma/client";
import { fetchExercises } from "../services/exercise";
import { Request,Response } from "express";
export async function syncExercises(req: Request, res: Response) {
  const { after, before } = req.query;

  const apiResponse = await fetchExercises({
    limit: 200,
    after: after as string | undefined,
    before: before as string | undefined,
  });

  console.log("NEXT CURSOR:", apiResponse.meta.nextCursor);
  console.log("HAS NEXT:", apiResponse.meta.hasNextPage);

  for (const ex of apiResponse.data) {
    await prisma.exercise.upsert({
      where: { exerciseApiId: ex.exerciseId },
      update: {},
      create: {
        exerciseApiId: ex.exerciseId,
        name: ex.name,
        imageUrl: ex.imageUrl,
        videoUrl: ex.videoUrl ?? null,
        exerciseType: ex.exerciseType,
        bodyParts: ex.bodyParts,
        equipments: ex.equipments,
        targetMuscles: ex.targetMuscles,
        secondaryMuscles: ex.secondaryMuscles,
        keywords: ex.keywords,
      },
    });
  }

  res.json({
    success: true,
    nextCursor: apiResponse.meta.nextCursor,
    hasNext: apiResponse.meta.hasNextPage,
  });
}
