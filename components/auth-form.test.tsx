import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthForm } from "./auth-form";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/app/actions/auth", () => mocks);

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

beforeEach(() => {
  mocks.signIn.mockReset();
  mocks.signUp.mockReset();
});

describe("authentication forms", () => {
  it("renders labeled sign-in fields and a registration link", () => {
    render(<AuthForm mode="sign-in" />);

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    expect(screen.getByLabelText("Email address")).toHaveAttribute(
      "autocomplete",
      "email",
    );
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    expect(
      screen.getByRole("link", { name: "Create an account" }),
    ).toHaveAttribute("href", "/register");
    expect(
      screen.queryByLabelText("Confirm password"),
    ).not.toBeInTheDocument();
  });

  it("renders registration fields and an accessible setup error without credentials", () => {
    render(
      <AuthForm
        mode="sign-up"
        notice="Supabase is not configured."
        noticeIsError
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Create your account" }),
    ).toBeVisible();
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Supabase is not configured.",
    );
    expect(screen.getByRole("button", { name: "Create account" })).toBeEnabled();
  });

  it("shows a confirmation notice as a polite status message", () => {
    render(
      <AuthForm
        mode="sign-up"
        notice="Check your email for a confirmation link."
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Check your email for a confirmation link.",
    );
  });
});
