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

    expect(screen.getByRole("heading", { name: "Välkommen tillbaka" })).toBeVisible();
    expect(screen.getByLabelText("E-postadress")).toHaveAttribute(
      "autocomplete",
      "email",
    );
    expect(screen.getByLabelText("Lösenord")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    expect(
      screen.getByRole("link", { name: "Skapa ett konto" }),
    ).toHaveAttribute("href", "/register");
    expect(
      screen.queryByLabelText("Bekräfta lösenord"),
    ).not.toBeInTheDocument();
  });

  it("renders registration fields and an accessible setup error without credentials", () => {
    render(
      <AuthForm
        mode="sign-up"
        notice="Supabase är inte konfigurerat."
        noticeIsError
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Skapa ditt konto" }),
    ).toBeVisible();
    expect(screen.getByLabelText("Bekräfta lösenord")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Supabase är inte konfigurerat.",
    );
    expect(screen.getByRole("button", { name: "Skapa konto" })).toBeEnabled();
  });

  it("shows a confirmation notice as a polite status message", () => {
    render(
      <AuthForm
        mode="sign-up"
        notice="Kontrollera din e-post för en bekräftelselänk."
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Kontrollera din e-post för en bekräftelselänk.",
    );
  });
});
