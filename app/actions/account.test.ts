import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteAccount } from "./account";
import { initialAuthActionState } from "../../lib/auth/action-state";

const mocks = vi.hoisted(() => ({
  server: null as unknown,
  admin: null as unknown,
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("../../lib/supabase/server", () => ({
  createSupabaseServerClient: () => Promise.resolve(mocks.server),
}));
vi.mock("../../lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => mocks.admin,
}));

const user = { id: "verified-user-id", email: "anna.demo@example.com" };
let signInWithPassword: ReturnType<typeof vi.fn>;
let signOut: ReturnType<typeof vi.fn>;
let deleteUser: ReturnType<typeof vi.fn>;

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

function setup(authedUser: typeof user | null = user) {
  signInWithPassword = vi.fn(() => Promise.resolve({ error: null }));
  signOut = vi.fn(() => Promise.resolve({ error: null }));
  deleteUser = vi.fn(() => Promise.resolve({ error: null }));
  mocks.server = {
    auth: {
      getUser: () =>
        Promise.resolve({ data: { user: authedUser }, error: null }),
      signInWithPassword,
      signOut,
    },
  };
  mocks.admin = { auth: { admin: { deleteUser } } };
}

describe("deleteAccount", () => {
  beforeEach(() => {
    mocks.redirect.mockClear();
    setup();
  });

  it("redirects unauthenticated users without deleting anything", async () => {
    setup(null);
    await expect(
      deleteAccount(initialAuthActionState, form({ email: user.email, password: "x" })),
    ).rejects.toThrow("REDIRECT:/login");
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("rejects an email that does not match the signed-in account", async () => {
    const result = await deleteAccount(
      initialAuthActionState,
      form({ email: "other@example.com", password: "secret" }),
    );
    expect(result.status).toBe("error");
    expect(result.fieldErrors?.email).toBeDefined();
    expect(signInWithPassword).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("rejects a wrong password without deleting", async () => {
    signInWithPassword.mockResolvedValue({ error: { code: "invalid_credentials" } });
    const result = await deleteAccount(
      initialAuthActionState,
      form({ email: user.email, password: "wrong" }),
    );
    expect(result.fieldErrors?.password).toBeDefined();
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("requires both fields", async () => {
    const result = await deleteAccount(initialAuthActionState, form({}));
    expect(result.status).toBe("error");
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("reports missing server configuration without deleting", async () => {
    mocks.admin = null;
    const result = await deleteAccount(
      initialAuthActionState,
      form({ email: user.email, password: "secret" }),
    );
    expect(result.status).toBe("error");
  });

  it("deletes only the verified session user, ignoring any client-supplied id", async () => {
    await expect(
      deleteAccount(
        initialAuthActionState,
        form({ email: "ANNA.demo@example.com", password: "secret", userId: "someone-else" }),
      ),
    ).rejects.toThrow("REDIRECT:/login?notice=account-deleted");
    expect(deleteUser).toHaveBeenCalledExactlyOnceWith(user.id);
    expect(signOut).toHaveBeenCalled();
  });

  it("returns a generic error when deletion fails and stays signed in", async () => {
    deleteUser.mockResolvedValue({ error: { message: "internal detail" } });
    const result = await deleteAccount(
      initialAuthActionState,
      form({ email: user.email, password: "secret" }),
    );
    expect(result.status).toBe("error");
    expect(result.message).not.toContain("internal detail");
    expect(signOut).not.toHaveBeenCalled();
  });
});
