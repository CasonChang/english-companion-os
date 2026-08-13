import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewPage } from "./ReviewPage";

const saveWebReview = vi.fn();
const loadReviewSources = vi.fn();

vi.mock("../features/auth/AuthContext", () => ({ useAuth: () => ({ session: { user: { id: "user-1" } } }) }));
vi.mock("../features/i18n/I18nProvider", () => ({ useI18n: () => ({ locale: "en", t: (value: string) => value }) }));
vi.mock("../lib/reviewPersistence", () => ({ saveWebReview: (...args: unknown[]) => saveWebReview(...args) }));
vi.mock("../lib/reviewSources", () => ({ loadReviewSources: () => loadReviewSources() }));

describe("ReviewPage", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    saveWebReview.mockReset().mockResolvedValue(undefined);
    loadReviewSources.mockReset().mockResolvedValue({
      items: [{ id: "item-1", type: "phrase", text: "wind down", meaning: "to gradually relax", example: "I read to wind down.", note: null, review_level: 1, next_review_at: "2026-08-10", days_overdue: 3 }],
      mistakes: []
    });
  });

  it("reveals an answer, saves the rating, and shows the recap", async () => {
    render(<ReviewPage/>);
    expect(await screen.findByText("How would you naturally say: to gradually relax?")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Or simply say it out loud…"), { target: { value: "wind down" } });
    fireEvent.click(screen.getByRole("button", { name: "Show answer" }));
    fireEvent.click(screen.getByRole("button", { name: "Good" }));
    await waitFor(() => expect(saveWebReview).toHaveBeenCalledWith("user-1", expect.objectContaining({ learningItemId: "item-1" }), "good", "wind down"));
    expect(await screen.findByText("Review complete")).toBeInTheDocument();
    expect(screen.getByText("items reviewed")).toBeInTheDocument();
  });

  it("keeps the current card visible when persistence fails", async () => {
    saveWebReview.mockRejectedValue(new Error("offline"));
    render(<ReviewPage/>);
    await screen.findByText("How would you naturally say: to gradually relax?");
    fireEvent.click(screen.getByRole("button", { name: "Show answer" }));
    fireEvent.click(screen.getByRole("button", { name: "Hard" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("wasn’t saved");
    expect(screen.getByText("How would you naturally say: to gradually relax?")).toBeInTheDocument();
  });

  it("does not offer a card again after its result was saved today", async () => {
    localStorage.setItem(`ecos-review-progress:user-1:${new Date().toISOString().slice(0, 10)}`, JSON.stringify(["item:item-1"]));
    render(<ReviewPage/>);
    expect(await screen.findByText("You’re all caught up")).toBeInTheDocument();
    expect(screen.queryByText("How would you naturally say: to gradually relax?")).not.toBeInTheDocument();
  });
});
