import { beforeEach, describe, expect, it, vi } from "vitest";
import { getWorkspaceData } from "./data";

const mocks = vi.hoisted(() => ({
  serverClient: null as unknown,
}));

vi.mock("server-only", () => ({}));

vi.mock("../supabase/server", () => ({
  createSupabaseServerClient: () => Promise.resolve(mocks.serverClient),
}));

type QueryResult = { data: unknown; error: unknown };
type QueryBuilder = Record<string, unknown>;

const projects = [
  {
    id: "owned-project",
    owner_id: "authenticated-user",
    name: "Website refresh",
    description: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
  },
];
const tasks = [
  {
    id: "owned-task",
    project_id: "owned-project",
    title: "Prepare launch",
    description: null,
    status: "todo",
    priority: "medium",
    due_date: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
  },
];

function createQueryBuilder(result: QueryResult): QueryBuilder {
  const builder: QueryBuilder = {};
  builder.select = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.in = vi.fn(() => builder);
  builder.not = vi.fn(() => builder);
  builder.then = (
    resolve: (value: QueryResult) => unknown,
    reject?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(resolve, reject);
  return builder;
}

beforeEach(() => {
  const builders = [
    createQueryBuilder({ data: projects, error: null }),
    createQueryBuilder({ data: tasks, error: null }),
    createQueryBuilder({ data: [], error: null }),
    createQueryBuilder({ data: [], error: null }),
  ];
  let index = 0;
  mocks.serverClient = {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: "authenticated-user", email: "ada@example.com" } },
        error: null,
      })),
    },
    from: vi.fn(() => builders[index++]),
  };
});

describe("workspace data access", () => {
  it("loads projects and tasks through the session Supabase client", async () => {
    const result = await getWorkspaceData();

    expect(result.error).toBeNull();
    expect(result.currentUserId).toBe("authenticated-user");
    expect(result.projects).toEqual(projects);
    expect(result.tasks).toEqual([
      {
        ...tasks[0],
        project: { id: projects[0].id, name: projects[0].name },
      },
    ]);
    expect(result.members).toEqual([]);
    expect(result.sprints).toEqual([]);
  });

  it("returns an explicit configuration error when Supabase is unavailable", async () => {
    mocks.serverClient = null;

    await expect(getWorkspaceData()).resolves.toMatchObject({
      projects: [],
      tasks: [],
      error: expect.stringContaining("Supabase-konfigurationen"),
    });
  });
});
