import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createProject,
  createTask,
  deleteProject,
  deleteTask,
  updateProject,
  updateTask,
} from "./workspace";
import { initialWorkspaceActionState } from "../../lib/workspace/validation";

const mocks = vi.hoisted(() => ({
  serverClient: null as unknown,
  revalidatePath: vi.fn(),
}));

vi.mock("../../lib/supabase/server", () => ({
  createSupabaseServerClient: () => Promise.resolve(mocks.serverClient),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

type QueryResult = { data: unknown; error: unknown };
type QueryBuilder = Record<string, unknown>;

const user = { id: "authenticated-user" };
const ownedProject = { id: "a8f5a1ea-64c2-42fd-ae86-5d39cf9e5b05" };
const ownedTask = {
  id: "17cf2d6e-054c-4cf0-a2c6-d34c6a0d27ae",
  project_id: ownedProject.id,
};
let queuedResults: QueryResult[];
let builders: QueryBuilder[];
let authenticated: boolean;

function createQueryBuilder(): QueryBuilder {
  const builder: QueryBuilder = {};
  const nextResult = () =>
    queuedResults.shift() ?? { data: null, error: null };

  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.maybeSingle = vi.fn(() => Promise.resolve(nextResult()));
  builder.insert = vi.fn(() => builder);
  builder.update = vi.fn(() => builder);
  builder.delete = vi.fn(() => builder);
  builder.then = (
    resolve: (result: QueryResult) => unknown,
    reject?: (reason: unknown) => unknown,
  ) => Promise.resolve(nextResult()).then(resolve, reject);
  return builder;
}

function configureClient() {
  const client = {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: authenticated ? user : null },
        error: authenticated ? null : { message: "No session" },
      })),
    },
    from: vi.fn(() => {
      const builder = createQueryBuilder();
      builders.push(builder);
      return builder;
    }),
  };
  mocks.serverClient = client;
}

function form(values: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }
  return formData;
}

function enqueue(...results: QueryResult[]) {
  queuedResults.push(...results);
}

beforeEach(() => {
  queuedResults = [];
  builders = [];
  authenticated = true;
  mocks.revalidatePath.mockClear();
  configureClient();
});

describe("workspace server actions", () => {
  it("creates a project using the verified session user, not submitted ownership", async () => {
    enqueue({ data: null, error: null });

    const result = await createProject(
      initialWorkspaceActionState,
      form({
        name: "  Website refresh  ",
        description: "",
        owner_id: "attacker-controlled-user",
      }),
    );

    expect(result).toMatchObject({ status: "success" });
    expect(builders[0].insert).toHaveBeenCalledWith({
      owner_id: user.id,
      name: "Website refresh",
      description: null,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
  });

  it("does not create a project when there is no authenticated user", async () => {
    authenticated = false;

    const result = await createProject(
      initialWorkspaceActionState,
      form({ name: "Private work", description: "" }),
    );

    expect(result).toMatchObject({ status: "error" });
    expect(builders).toHaveLength(0);
  });

  it("creates a task only after verifying ownership of its project", async () => {
    enqueue(
      { data: ownedProject, error: null },
      { data: null, error: null },
    );

    const result = await createTask(
      initialWorkspaceActionState,
      form({
        projectId: ownedProject.id,
        title: "Prepare release",
        description: "",
        status: "todo",
        priority: "high",
        dueDate: "",
      }),
    );

    expect(result).toMatchObject({ status: "success" });
    expect(builders[1].insert).toHaveBeenCalledWith({
      project_id: ownedProject.id,
      title: "Prepare release",
      description: null,
      status: "todo",
      priority: "high",
      due_date: null,
    });
  });

  it("rejects tasks assigned to a project not owned by the current user", async () => {
    enqueue({ data: null, error: null });

    const result = await createTask(
      initialWorkspaceActionState,
      form({
        projectId: ownedProject.id,
        title: "Prepare release",
        description: "",
        status: "todo",
        priority: "medium",
        dueDate: "",
      }),
    );

    expect(result).toMatchObject({ status: "error" });
    expect(builders).toHaveLength(1);
  });

  it("updates a project only after confirming its ownership", async () => {
    enqueue(
      { data: ownedProject, error: null },
      { data: { id: ownedProject.id }, error: null },
    );

    const result = await updateProject(
      initialWorkspaceActionState,
      form({
        id: ownedProject.id,
        name: "Updated project",
        description: "A description",
      }),
    );

    expect(result).toMatchObject({ status: "success" });
    expect(builders[1].update).toHaveBeenCalledWith({
      name: "Updated project",
      description: "A description",
    });
    expect(builders[1].eq).toHaveBeenNthCalledWith(1, "id", ownedProject.id);
    expect(builders[1].eq).toHaveBeenNthCalledWith(2, "owner_id", user.id);
  });

  it("updates a task only when both its current and target projects are owned", async () => {
    enqueue(
      { data: ownedTask, error: null },
      { data: ownedProject, error: null },
      { data: { id: ownedTask.id }, error: null },
    );

    const result = await updateTask(
      initialWorkspaceActionState,
      form({
        id: ownedTask.id,
        projectId: ownedProject.id,
        title: "Updated task",
        description: "",
        status: "in_progress",
        priority: "medium",
        dueDate: "",
      }),
    );

    expect(result).toMatchObject({ status: "success" });
    expect(builders[0].select).toHaveBeenCalledWith("id, project_id");
    expect(builders[2].update).toHaveBeenCalledWith({
      project_id: ownedProject.id,
      title: "Updated task",
      description: null,
      status: "in_progress",
      priority: "medium",
      due_date: null,
    });
  });

  it("rejects moving a task to a project not owned by the current user", async () => {
    enqueue(
      { data: ownedTask, error: null },
      { data: null, error: null },
    );

    const result = await updateTask(
      initialWorkspaceActionState,
      form({
        id: ownedTask.id,
        projectId: "956da2ef-8e0e-47b3-b3c4-1656f39b8329",
        title: "Updated task",
        description: "",
        status: "todo",
        priority: "medium",
        dueDate: "",
      }),
    );

    expect(result).toMatchObject({ status: "error" });
    expect(builders).toHaveLength(2);
    expect(builders[1].update).not.toHaveBeenCalled();
  });

  it("deletes an owned project and its tasks through the schema cascade", async () => {
    enqueue(
      { data: ownedProject, error: null },
      { data: { id: ownedProject.id }, error: null },
    );

    const result = await deleteProject(
      initialWorkspaceActionState,
      form({ id: ownedProject.id }),
    );

    expect(result).toMatchObject({ status: "success" });
    expect(builders[1].delete).toHaveBeenCalledOnce();
    expect(builders[1].eq).toHaveBeenNthCalledWith(2, "owner_id", user.id);
  });

  it("deletes a task only after checking ownership through its project", async () => {
    enqueue(
      { data: ownedTask, error: null },
      { data: ownedProject, error: null },
      { data: { id: ownedTask.id }, error: null },
    );

    const result = await deleteTask(
      initialWorkspaceActionState,
      form({ id: ownedTask.id }),
    );

    expect(result).toMatchObject({ status: "success" });
    expect(builders[2].delete).toHaveBeenCalledOnce();
  });
});
