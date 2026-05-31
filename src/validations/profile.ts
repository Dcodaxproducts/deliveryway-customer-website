import { z } from "zod";

export const profileSchema = z.object({
  firstName: z.string().trim(),
  lastName: z.string().trim(),
  email: z.string().trim(),
  phone: z.string().trim(),
  avatarUrl: z.string().trim(),
  bio: z.string().trim(),
  gender: z.string().trim(),
  country: z.string().trim(),
  language: z.string().trim(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
