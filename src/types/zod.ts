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