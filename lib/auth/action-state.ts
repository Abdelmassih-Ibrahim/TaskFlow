export type AuthFieldErrors = Partial<
  Record<"email" | "password" | "confirmPassword", string>
>;

export type AuthActionState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: AuthFieldErrors;
};

export const initialAuthActionState: AuthActionState = {
  status: "idle",
  message: "",
};
