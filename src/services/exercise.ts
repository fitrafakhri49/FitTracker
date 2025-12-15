import axios from "axios";

export type FetchExercisesParams = {
  limit?: number;
  after?: string;
  before?: string;
};

export async function fetchExercises(params: FetchExercisesParams) {
  const query = new URLSearchParams();

  if (params.limit) query.append("limit", params.limit.toString());
  if (params.after) query.append("after", params.after);
  if (params.before) query.append("before", params.before);

  const res = await fetch(
    `https://exercisedb-api1.p.rapidapi.com/api/v1/exercises?${query.toString()}`,
    {
      headers: {
        "X-RapidAPI-Key": process.env.RAPID_API_KEY!,
        "X-RapidAPI-Host": "exercisedb-api1.p.rapidapi.com",
      },
    }
  );

  return res.json();
}
