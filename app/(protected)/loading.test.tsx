import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import WorkspaceLoading from "./loading";

describe("workspace loading state", () => {
  it("announces loading state to assistive technology", () => {
    render(<WorkspaceLoading />);

    expect(
      screen.getByRole("main", { name: "Läser in din arbetsyta" }),
    ).toHaveAttribute("aria-busy", "true");
    expect(
      screen.getByText("Läser in dina projekt och uppgifter..."),
    ).toBeInTheDocument();
  });
});
