import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { QUESTIONS } from "../content/catalog";
import { MathTool } from "./MathTool";

function question(id: string) {
  const found = QUESTIONS.find((item) => item.id === id);
  if (!found) throw new Error(`Missing question ${id}`);
  return found;
}

afterEach(() => cleanup());

describe("K2 counting, pattern and number-bond visuals", () => {
  it("shows the actual dots for a K2 addition picture", () => {
    const { container } = render(<MathTool question={question("q-k2-math-add-within-10-1")} />);
    const pictures = container.querySelector('[data-testid="counting-pictures"]');
    expect(pictures?.getAttribute("data-groups")).toBe("3,2");
    expect(container.textContent).toContain("Put the two groups together.");
    expect(container.querySelector(".number-line-svg")).toBeNull();
  });

  it("shows the colour pattern instead of a number line", () => {
    const { container } = render(<MathTool question={question("q-k2-math-count-20-8")} />);
    expect(container.querySelector('[data-testid="pattern-tool"]')?.getAttribute("data-kind")).toBe("colour");
    expect(container.querySelectorAll(".pattern-dot")).toHaveLength(4);
    expect(container.querySelector(".pattern-missing")?.textContent).toBe("?");
  });

  it("shows a missing-number sequence from the prompt", () => {
    const { container } = render(<MathTool question={question("q-k2-math-count-20-6")} />);
    expect(container.querySelector('[data-testid="pattern-tool"]')?.getAttribute("data-kind")).toBe("number");
    expect(container.querySelectorAll(".pattern-chip")).toHaveLength(4);
    expect(container.querySelector(".is-missing")?.textContent).toBe("?");
  });

  it("puts the total at the top of a K2 number bond", () => {
    const { container } = render(<MathTool question={question("q-k2-math-add-within-10-5")} />);
    expect(container.querySelector(".number-bond-whole strong")?.textContent).toBe("8");
    expect(container.querySelectorAll(".number-bond-parts strong")[0]?.textContent).toBe("3");
    expect(container.querySelectorAll(".number-bond-parts strong")[1]?.textContent).toBe("?");
  });

  it("uses a bar model for a K2 subtraction story", () => {
    const { container } = render(<MathTool question={question("q-k2-math-add-within-10-11")} />);
    expect(container.querySelector(".bar-model-whole strong")?.textContent).toBe("6");
    expect(container.querySelectorAll(".bar-model-part strong")[0]?.textContent).toBe("2");
  });
});

describe("multiplication and shape visual models", () => {
  it("builds an array from a groups-of story", () => {
    const { container } = render(<MathTool question={question("q-math-multiply-tables-7")} />);
    const board = container.querySelector('[data-testid="array-board"]');
    expect(board?.getAttribute("data-rows")).toBe("2");
    expect(board?.getAttribute("data-columns")).toBe("6");
    expect(container.textContent).toContain("2 groups of 6");
  });

  it("builds an array from a rows-with story", () => {
    const { container } = render(<MathTool question={question("q-math-multiply-tables-11")} />);
    expect(container.querySelector('[data-testid="array-board"]')?.getAttribute("data-rows")).toBe("3");
    expect(container.querySelector('[data-testid="array-board"]')?.getAttribute("data-columns")).toBe("6");
  });

  it("uses 3D shape references for 3D shape questions", () => {
    const { container } = render(<MathTool question={question("q-math-shapes-4")} />);
    expect(container.querySelector('[data-testid="shapes-3d"]')).toBeTruthy();
    expect(container.querySelectorAll("[data-shape]")).toHaveLength(4);
  });
});

describe("clock numeral and matching model rules", () => {
  it("labels all twelve positions on the analogue clock", () => {
    const { container } = render(<MathTool question={question("q-math-time-1")} />);
    const labels = [...container.querySelectorAll(".clock-svg text")].map((node) => node.textContent);
    expect(labels).toHaveLength(12);
    expect(labels[0]).toBe("12");
    expect(labels[11]).toBe("11");
  });

  it("does not repeat an unrelated clock beside digital-time matching cards", () => {
    const { container } = render(<MathTool question={question("q-match-math-15")} />);
    expect(container.querySelector(".clock-visual")).toBeNull();
  });
});

describe("two-step math visual models", () => {
  it("shows both changes for a three-number add/sub question", () => {
    const { container } = render(<MathTool question={question("q-math-two-step-problems-1")} />);
    expect(container.querySelector('[data-testid="two-step-model"]')).toBeTruthy();
    expect(container.textContent).toContain("− 18");
    expect(container.textContent).toContain("+ 12");
    expect(container.querySelector(".bar-model-parts")).toBeNull();
  });

  it("uses subtraction then addition for a two-step chair problem", () => {
    const { container } = render(<MathTool question={question("q-math-two-step-problems-5")} />);
    expect(container.querySelector('[data-testid="two-step-model"]')).toBeTruthy();
    expect(container.textContent).toContain("− 9");
    expect(container.textContent).toContain("+ 6");
  });

  it("reads the operation that follows the number", () => {
    const { container } = render(<MathTool question={question("q-math-two-step-problems-3")} />);
    expect(container.textContent).toContain("− 23");
    expect(container.textContent).toContain("+ 15");
  });

  it("shows an array and crossed-out items for a multiply-then-remove question", () => {
    const { container } = render(<MathTool question={question("q-math-two-step-problems-7")} />);
    expect(container.querySelector('[data-testid="two-step-array"]')).toBeTruthy();
    expect(container.querySelectorAll(".two-step-array-grid span")).toHaveLength(28);
    expect(container.querySelectorAll(".two-step-array-grid span.is-removed")).toHaveLength(5);
  });

  it("shows a money model for a two-step change problem", () => {
    const { container } = render(<MathTool question={question("q-math-two-step-problems-10")} />);
    expect(container.querySelector('[data-testid="money-tool"]')).toBeTruthy();
    expect(container.textContent).toContain("$1.00");
  });

  it("shows pay minus cost for a change question", () => {
    const { container } = render(<MathTool question={question("q-math-two-step-problems-11")} />);
    expect(container.querySelector('[data-testid="money-tool"]')).toBeTruthy();
    expect(container.textContent).toContain("$5.00");
    expect(container.textContent).toContain("$3.50");
    expect(container.textContent).toContain("−");
  });
});
