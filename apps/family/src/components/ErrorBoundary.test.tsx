import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

function ProblemChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("boom");
  return <div>Healthy content</div>;
}

describe("ErrorBoundary", () => {
  it("renders a bilingual recovery screen when a child component throws and recovers on retry", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { rerender } = render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/小芽需要休息一下/)).toBeInTheDocument();

    rerender(
      <ErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>
    );
    fireEvent.click(screen.getByRole("button", { name: /重试/ }));
    expect(screen.getByText("Healthy content")).toBeInTheDocument();
    spy.mockRestore();
  });
});
