import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema } from "./validation";

describe("sign-in validation", () => {
  it("accepts a valid email and password", () => {
    expect(
      signInSchema.safeParse({
        email: "  person@example.com ",
        password: "correct-horse-battery",
      }).success,
    ).toBe(true);
  });

  it("rejects malformed email and short passwords", () => {
    const result = signInSchema.safeParse({
      email: "not-an-email",
      password: "short",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual([
        "email",
        "password",
      ]);
    }
  });
});

describe("registration validation", () => {
  it("requires matching passwords", () => {
    const result = signUpSchema.safeParse({
      email: "person@example.com",
      password: "correct-horse-battery",
      confirmPassword: "different-password",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

  it("accepts matching passwords", () => {
    expect(
      signUpSchema.safeParse({
        email: "person@example.com",
        password: "correct-horse-battery",
        confirmPassword: "correct-horse-battery",
      }).success,
    ).toBe(true);
  });
});
