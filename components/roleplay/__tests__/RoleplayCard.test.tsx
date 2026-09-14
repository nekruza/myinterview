/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { RoleplayCard } from "../RoleplayCard";
import type { RoleplayScenario } from "@/lib/types/roleplay";

const SCENARIO: RoleplayScenario = {
  id: "food-1",
  title: "Ordering at Restaurant",
  description: "Practice ordering food",
  difficulty: "Beginner",
  emoji: "🍔",
  category: "food",
  userRole: "Customer",
  aiRole: "Waiter",
  scenario: "A customer orders food at a restaurant.",
};

describe("RoleplayCard", () => {
  it("renders the emoji, title, description, and difficulty", () => {
    render(<RoleplayCard scenario={SCENARIO} href="/app/conversation?roleplay=food-1&tutor=luna" />);

    expect(screen.getByText("🍔")).toBeInTheDocument();
    expect(screen.getByText("Ordering at Restaurant")).toBeInTheDocument();
    expect(screen.getByText("Practice ordering food")).toBeInTheDocument();
    expect(screen.getByText("Beginner")).toBeInTheDocument();
  });

  it("links to the given href", () => {
    render(<RoleplayCard scenario={SCENARIO} href="/app/conversation?roleplay=food-1&tutor=luna" />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "/app/conversation?roleplay=food-1&tutor=luna");
  });

  it("does not render a custom badge or delete button for a non-custom scenario", () => {
    render(<RoleplayCard scenario={SCENARIO} href="/x" isCustom={false} onDelete={jest.fn()} />);

    expect(screen.queryByText("Custom")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a custom badge and delete button for a custom scenario", () => {
    render(<RoleplayCard scenario={SCENARIO} href="/x" isCustom onDelete={jest.fn()} />);

    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete Ordering at Restaurant" })).toBeInTheDocument();
  });

  it("does not render a delete button for a custom scenario without an onDelete handler", () => {
    render(<RoleplayCard scenario={SCENARIO} href="/x" isCustom />);

    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls onDelete without triggering navigation when the delete button is clicked", () => {
    const onDelete = jest.fn();
    render(<RoleplayCard scenario={SCENARIO} href="/x" isCustom onDelete={onDelete} />);

    const deleteButton = screen.getByRole("button", { name: "Delete Ordering at Restaurant" });
    const clickEvent = fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
    // fireEvent.click returns false when preventDefault() was called on the event.
    expect(clickEvent).toBe(false);
  });
});
