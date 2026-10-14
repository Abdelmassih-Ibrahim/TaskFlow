import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  initialWorkspaceActionState,
  type WorkspaceActionState,
} from "@/lib/workspace/validation";
import type { WorkspaceData } from "@/lib/workspace/types";
import { WorkspaceDashboard } from "./workspace-dashboard";
import { ProjectDialog, TaskDialog } from "./workspace-dialogs";

const mocks = vi.hoisted(() => ({
  createProject: vi.fn(),
  createTask: vi.fn(),
  updateProject: vi.fn(),
  updateTask: vi.fn(),
  deleteProject: vi.fn(),
  deleteTask: vi.fn(),
}));

vi.mock("@/app/actions/workspace", () => mocks);

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

const project = {
  id: "a8f5a1ea-64c2-42fd-ae86-5d39cf9e5b05",
  owner_id: "authenticated-user",
  name: "Website refresh",
  description: "Improve the public website.",
  created_at: "2026-10-01T00:00:00.000Z",
  updated_at: "2026-10-02T00:00:00.000Z",
};

const tasks = [
  {
    id: "17cf2d6e-054c-4cf0-a2c6-d34c6a0d27ae",
    project_id: project.id,
    project: { id: project.id, name: project.name },
    title: "Prepare release notes",
    description: null,
    status: "done" as const,
    priority: "high" as const,
    due_date: "2026-10-13",
    created_at: "2026-10-01T00:00:00.000Z",
    updated_at: "2026-10-02T00:00:00.000Z",
  },
  {
    id: "82606f17-adc9-4a47-9c3b-6b58c49cfc22",
    project_id: project.id,
    project: { id: project.id, name: project.name },
    title: "Review mobile layout",
    description: "Check the narrow-screen navigation.",
    status: "todo" as const,
    priority: "low" as const,
    due_date: null,
    created_at: "2026-10-01T00:00:00.000Z",
    updated_at: "2026-10-02T00:00:00.000Z",
  },
];

const workspace: WorkspaceData = {
  projects: [project],
  tasks,
  error: null,
};

beforeEach(() => {
  Object.values(mocks).forEach((mock) => {
    mock.mockReset();
    mock.mockResolvedValue(initialWorkspaceActionState);
  });
});

describe("workspace dashboard", () => {
  it("shows calculated project progress and filters tasks by priority", () => {
    render(<WorkspaceDashboard {...workspace} />);

    expect(
      screen.getByRole("progressbar", { name: "Förlopp för Website refresh" }),
    ).toHaveAttribute("aria-valuenow", "50");
    expect(screen.getByText("1 av 2 klara")).toBeVisible();

    const priorityFilter = screen.getByRole("combobox", {
      name: "Filtrera efter prioritet",
    });
    fireEvent.change(priorityFilter, { target: { value: "high" } });

    const table = screen.getByRole("table");
    expect(within(table).getByText("Prepare release notes")).toBeVisible();
    expect(
      within(table).queryByText("Review mobile layout"),
    ).not.toBeInTheDocument();
  });

  it("shows an empty project state and disables task creation when no project exists", () => {
    render(<WorkspaceDashboard projects={[]} tasks={[]} error={null} />);

    expect(screen.getByText("Börja med ett projekt")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Lägg till uppgift" }),
    ).toBeDisabled();
    expect(screen.getByText("Inga uppgifter ännu")).toBeVisible();
  });

  it("shows a recoverable workspace error instead of empty-looking data", () => {
    render(
      <WorkspaceDashboard
        projects={[]}
        tasks={[]}
        error="Det gick inte att läsa in dina projekt. Försök igen."
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Det gick inte att läsa in dina projekt.",
    );
    expect(screen.getByRole("button", { name: "Försök igen" })).toBeVisible();
    expect(screen.queryByText("Börja med ett projekt")).not.toBeInTheDocument();
  });

  it("displays the sign-out failure notice returned by the server action", () => {
    const { rerender } = render(
      <WorkspaceDashboard {...workspace} signOutError />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Det gick inte att logga ut. Försök igen.",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Stäng meddelandet om utloggningsfel" }),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    rerender(<WorkspaceDashboard {...workspace} signOutError={false} />);
    rerender(<WorkspaceDashboard {...workspace} signOutError />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Det gick inte att logga ut. Försök igen.",
    );
  });

  it("clears active filters from the task list", () => {
    render(<WorkspaceDashboard {...workspace} />);
    fireEvent.change(screen.getByRole("combobox", { name: "Filtrera efter prioritet" }), {
      target: { value: "low" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Rensa filter" }));

    expect(
      screen.getByRole("combobox", { name: "Filtrera efter prioritet" }),
    ).toHaveValue("all");
    expect(
      within(screen.getByRole("table")).getByText("Prepare release notes"),
    ).toBeVisible();
  });
});

describe("project and task forms", () => {
  it("renders required project fields with validation descriptions", () => {
    render(<ProjectDialog project={null} onClose={vi.fn()} />);

    expect(screen.getByLabelText("Projektnamn")).toBeRequired();
    expect(screen.getByLabelText("Beskrivning Valfritt")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Skapa projekt" }),
    ).toBeEnabled();
  });

  it("renders the task fields, including status, priority, and due date", () => {
    render(<TaskDialog task={null} projects={[project]} onClose={vi.fn()} />);

    expect(screen.getByLabelText("Uppgiftstitel")).toBeRequired();
    expect(screen.getByLabelText("Projekt")).toHaveValue(project.id);
    expect(screen.getByLabelText("Status")).toHaveValue("todo");
    expect(screen.getByLabelText("Prioritet")).toHaveValue("medium");
    expect(screen.getByLabelText("Förfallodatum")).toHaveAttribute("type", "date");
  });

  it("associates a server validation error with the project name field", async () => {
    mocks.createProject.mockResolvedValue({
      status: "error",
      message: "Kontrollera fälten nedan och försök igen.",
      fieldErrors: { name: "Ange ett projektnamn." },
    });
    const { container } = render(
      <ProjectDialog project={null} onClose={vi.fn()} />,
    );
    const form = container.querySelector("form");
    if (!form) throw new Error("Project form did not render.");

    fireEvent.submit(form);

    expect(await screen.findByText("Ange ett projektnamn.")).toBeVisible();
    expect(screen.getByLabelText("Projektnamn")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Kontrollera fälten nedan och försök igen.",
    );
  });

  it("disables project form actions while a save is pending", async () => {
    let resolveAction: ((state: WorkspaceActionState) => void) | undefined;
    mocks.createProject.mockImplementation(
      () =>
        new Promise<WorkspaceActionState>((resolve) => {
          resolveAction = resolve;
        }),
    );
    render(<ProjectDialog project={null} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Projektnamn"), {
      target: { value: "Portfolio work" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Skapa projekt" }));

    const submitButton = await screen.findByRole("button", {
      name: "Sparar...",
    });
    expect(submitButton).toBeDisabled();
    expect(screen.getByRole("button", { name: "Avbryt" })).toBeDisabled();

    await act(async () => {
      resolveAction?.({
        status: "error",
        message: "The test request has finished.",
      });
    });
  });
});
