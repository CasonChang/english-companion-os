import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext } from "../features/auth/AuthContext";
import { LoginPage } from "./LoginPage";

const { signInWithPassword } = vi.hoisted(() => ({ signInWithPassword: vi.fn() }));

vi.mock("../lib/supabase", () => ({
  supabase: { auth: { signInWithPassword } }
}));

describe("LoginPage", () => {
  beforeEach(() => signInWithPassword.mockReset());

  it("shows a friendly error when credentials are rejected", async () => {
    signInWithPassword.mockResolvedValue({ error: new Error("Invalid login credentials") });
    const user = userEvent.setup();

    render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <AuthContext.Provider value={{ loading: false, session: null, signOut: vi.fn() }}>
          <LoginPage />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText("Email"), "wrong@example.com");
    await user.type(screen.getByLabelText("Password"), "not-the-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(signInWithPassword).toHaveBeenCalledWith({ email: "wrong@example.com", password: "not-the-password" });
    expect(await screen.findByRole("alert")).toHaveTextContent("That email or password didn’t work");
  });
});
