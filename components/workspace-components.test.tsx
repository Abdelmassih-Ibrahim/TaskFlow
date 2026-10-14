import {
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  initialWorkspaceActionState,
  type WorkspaceData,
} from "@/lib/workspace/validation";
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
  vi.stubGlobal("confirm", vi.fn(() => true));
});

describe("workspace dashboard", () => {
  it("shows calculated project progress and filters tasks by priority", () => {
    render(<WorkspaceDashboard {...workspace} />);

    expect(
      screen.getByRole("progressbar", { name: "Website refresh progress" }),
    ).toHaveAttribute("aria-valuenow", "50");
    expect(screen.getByText("1 of 2 complete")).toBeVisible();

    const priorityFilter = screen.getByRole("combobox", {
      name: "Filter by priority",
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

    expect(screen.getByText("Start with a project")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Add task" }),
    ).toBeDisabled();
    expect(screen.getByText("No tasks yet")).toBeVisible();
  });

  it("shows a recoverable workspace error instead of empty-looking data", () => {
    render(
      <WorkspaceDashboard
        projects={[]}
        tasks={[]}
        error="We couldn't load your projects. Please try again."
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "We couldn't load your projects.",
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
    expect(screen.queryByText("Start with a project")).not.toBeInTheDocument();
  });

  it("clears active filters from the task list", () => {
    render(<WorkspaceDashboard {...workspace} />);
    fireEvent.change(screen.getByRole("combobox", { name: "Filter by priority" }), {
      target: { value: "low" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(
      screen.getByRole("combobox", { name: "Filter by priority" }),
    ).toHaveValue("all");
    expect(
      within(screen.getByRole("table")).getByText("Prepare release notes"),
    ).toBeVisible();
  });
});

describe("project and task forms", () => {
  it("renders required project fields with validation descriptions", () => {
    render(<ProjectDialog project={null} onClose={vi.fn()} />);

    expect(screen.getByLabelText("Project name")).toBeRequired();
    expect(screen.getByLabelText("Description Optional")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create project" }),
    ).toBeEnabled();
  });

  it("renders the task fields, including status, priority, and due date", () => {
    render(<TaskDialog task={null} projects={[project]} onClose={vi.fn()} />);

    expect(screen.getByLabelText("Task title")).toBeRequired();
    expect(screen.getByLabelText("Project")).toHaveValue(project.id);
    expect(screen.getByLabelText("Status")).toHaveValue("todo");
    expect(screen.getByLabelText("Priority")).toHaveValue("medium");
    expect(screen.getByLabelText("Due date")).toHaveAttribute("type", "date");
  });
});
