import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PuppyCompanion } from "./PuppyCompanion";

describe("PuppyCompanion", () => {
  it("renders the full puppy figure with an accessible name", () => {
    render(<PuppyCompanion state="idle" />);
    expect(screen.getByLabelText("陪伴小狗豆豆")).toBeInTheDocument();
    expect(screen.getByTestId("puppy-motion")).toHaveAttribute("data-state", "idle");
    expect(screen.getByTestId("puppy-sprite")).toBeInTheDocument();
  });

  it("calls the interaction handler when the child taps the puppy", () => {
    const onInteract = vi.fn();
    render(<PuppyCompanion state="idle" onInteract={onInteract} interactive />);
    fireEvent.click(screen.getByRole("button", { name: "和小狗豆豆互动" }));
    expect(onInteract).toHaveBeenCalledTimes(1);
  });

  it("renders every approved visual state", () => {
    const { rerender } = render(<PuppyCompanion state="idle" />);
    for (const state of ["greet", "listen", "think", "celebrate", "comfort", "tap-react", "rest"] as const) {
      rerender(<PuppyCompanion state={state} />);
      expect(screen.getByTestId("puppy-motion")).toHaveAttribute("data-state", state);
    }
  });

  it("uses a non-interactive figure when interaction is disabled", () => {
    render(<PuppyCompanion state="listen" interactive={false} />);
    expect(screen.queryByRole("button", { name: "和小狗豆豆互动" })).toBeNull();
  });
});
