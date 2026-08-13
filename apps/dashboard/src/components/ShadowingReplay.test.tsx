import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ShadowingReplay } from "./ShadowingReplay";

describe("ShadowingReplay", () => {
  beforeEach(() => Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { cancel: vi.fn(), speak: vi.fn() } }));
  it("advances one line at a time and finishes", () => {
    render(<ShadowingReplay lines={["First line.", "Second line."]}/>);
    fireEvent.click(screen.getByRole("button", { name: /Replay shadowing/ }));
    expect(screen.getByText("First line.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "I said it →" }));
    expect(screen.getByText("Second line.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "I said it →" }));
    expect(screen.getByText("Replay complete")).toBeInTheDocument();
  });
});
