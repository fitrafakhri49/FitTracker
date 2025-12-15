import { prisma } from "../prisma/client"; 
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";

export async function getExercises(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || "";

    const where = search
      ? {
          name: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        }
      : {};

    const totalExercises = await prisma.exercise.count({ where });

    const exercises = await prisma.exercise.findMany({
      skip,
      take: limit,
      where,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        exerciseType: true,
        imageUrl: true,
        videoUrl: true,
        bodyParts: true,
        equipments: true,
        targetMuscles: true,
        secondaryMuscles: true,
      },
    });

    res.json({
      success: true,
      data: exercises,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalExercises / limit),
        totalItems: totalExercises,
      },
    });
  } catch (error: any) {
    console.error("Error fetching exercises:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
}
