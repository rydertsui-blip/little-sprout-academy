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

describe("two-step math visual models", () => {
  it("shows both changes for a three-number add/sub question", () => {
    const { container } = render(<MathTool question={question("q-math-two-step-problems-1")} />);
    expect(container.querySelector('[data-testid="two-step-model"]')).toBeTruthy();
    expect(container.textContent).toContain("− 18");
    expect(container.textContent).toContain("+ 12");
    expect(container.querySelector(".bar-model-parts")).toBeNull();
  });

  it("uses subtraction when a quantity is used", () => {
    const { container } = render(<MathTool question={question("q-math-two-step-problems-5")} />);
    expect(container.querySelector(".bar-model-whole strong")?.textContent).toBe("24");
    expect(container.querySelectorAll(".bar-model-part strong")[0]?.textContent).toBe("9");
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

  it("shows a sum when cents are added", () => {
    const { container } = render(<MathTool question={question("q-math-two-step-problems-10")} />);
    expect(container.querySelector('[data-testid="money-tool"]')).toBeTruthy();
    expect(container.textContent).toContain("40¢");
    expect(container.textContent).toContain("25¢");
    expect(container.textContent).toContain("+");
  });

  it("shows pay minus cost for a change question", () => {
    const { container } = render(<MathTool question={question("q-math-two-step-problems-11")} />);
    expect(container.querySelector('[data-testid="money-tool"]')).toBeTruthy();
    expect(container.textContent).toContain("$5.00");
    expect(container.textContent).toContain("$3.50");
    expect(container.textContent).toContain("−");
  });
});
