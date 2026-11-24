import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CompanionPreviewScreen } from "./CompanionPreviewScreen";

describe("companion preview", () => {
  it("shows the interactive puppy and state controls", () => {
    render(<CompanionPreviewScreen />);
    expect(screen.getByLabelText("陪伴小狗豆豆")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "聆听" })).toBeInTheDocument();
  });

  it("reacts when the puppy is tapped", () => {
    render(<CompanionPreviewScreen />);
    fireEvent.click(screen.getByRole("button", { name: "和小狗豆豆互动" }));
    expect(screen.getByTestId("puppy-motion")).toHaveAttribute("data-state", "tap-react");
  });

  it("switches to celebrate from the preview controls", () => {
    render(<CompanionPreviewScreen />);
    fireEvent.click(screen.getByRole("button", { name: "庆祝" }));
    expect(screen.getByTestId("puppy-motion")).toHaveAttribute("data-state", "celebrate");
  });
});
