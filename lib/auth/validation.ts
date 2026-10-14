import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Ange din e-postadress.")
  .email("Ange en giltig e-postadress.")
  .max(254, "E-postadressen får innehålla högst 254 tecken.");

const passwordSchema = z
  .string()
  .min(8, "Använd minst 8 tecken.")
  .max(72, "Lösenordet får innehålla högst 72 tecken.");

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Bekräfta ditt lösenord."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Lösenorden stämmer inte överens.",
  });
