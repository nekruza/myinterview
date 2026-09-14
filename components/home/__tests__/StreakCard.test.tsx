/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { StreakCard } from "../StreakCard";

const WEEK = new Array(7).fill(false);

describe("home StreakCard", () => {
  it("renders all seven day-of-week labels", () => {
    render(<StreakCard currentStreak={3} weeklyActivity={WEEK} now={new Date(2026, 8, 13)} />);
    for (const label of ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("renders the current streak count", () => {
    render(<StreakCard currentStreak={12} weeklyActivity={WEEK} now={new Date(2026, 8, 13)} />);
    expect(screen.getByText(/12/)).toBeInTheDocument();
    expect(screen.getByText("day streak")).toBeInTheDocument();
  });

  it("shows the empty-state prompt when the streak is zero", () => {
    render(<StreakCard currentStreak={0} weeklyActivity={WEEK} now={new Date(2026, 8, 13)} />);
    expect(screen.getByText("Start your streak today by having a voice conversation.")).toBeInTheDocument();
  });

  it("hides the empty-state prompt once a streak exists", () => {
    render(<StreakCard currentStreak={1} weeklyActivity={WEEK} now={new Date(2026, 8, 13)} />);
    expect(screen.queryByText("Start your streak today by having a voice conversation.")).not.toBeInTheDocument();
  });

  it("links to the roleplay page", () => {
    render(<StreakCard currentStreak={1} weeklyActivity={WEEK} now={new Date(2026, 8, 13)} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/app/roleplay");
  });

  it("shows the Monday-Sunday week range", () => {
    render(<StreakCard currentStreak={1} weeklyActivity={WEEK} now={new Date(2026, 8, 13)} />);
    expect(screen.getByText("Sep 7-13")).toBeInTheDocument();
  });
});
