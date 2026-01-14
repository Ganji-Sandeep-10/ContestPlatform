import { email, z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["contestee", "creator"]).optional().default("contestee"),
});


export const loginSchema=z.object({
    email:z.string().email(),
    password:z.string().min(6)
})

export const createContestSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
});

export const postMcqSchema = z.object({
    questionText: z.string().min(1),
    options: z.array(z.string()).min(2),
    correctOptionIndex: z.number().int().nonnegative(),
    points: z.number().int().positive().default(1),
  })
  .refine(
    data => data.correctOptionIndex < data.options.length,
    {
      message: "INVALID_REQUEST",
      path: ["correctOptionIndex"],
    }
  );


export const submitMcqSchema = z.object({
  selectedOptionIndex: z.number().int().nonnegative(),
});

const testcaseSchema = z.object({
  input: z.string(),
  expectedOutput: z.string(),
  isHidden:z.boolean().default(false)
})

export const postDsaSchema=z.object({
  title:z.string().min(1),
  description:z.string().min(1),
  tags:z.array(z.string()).min(1),
  points:z.number().int().nonnegative(),
  timeLimit: z.number().int().nonnegative(),
  memoryLimit: z.number().int().nonnegative(),
  testCases: z.array(testcaseSchema).min(1),
})

export const submitProblemSchema = z.object({
  code: z.string().min(1),
  language: z.string().min(1),
});
