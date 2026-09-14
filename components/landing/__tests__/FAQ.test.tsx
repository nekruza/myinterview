/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { FAQ } from "../FAQ";
import { FAQ_ITEMS } from "../faq-data";
import { LANGUAGES } from "@/lib/languages";

describe("landing FAQ", () => {
  it("renders every question from FAQ_ITEMS", () => {
    render(<FAQ />);
    for (const item of FAQ_ITEMS) {
      expect(screen.getByText(item.question)).toBeInTheDocument();
    }
  });

  it("renders every answer from FAQ_ITEMS", () => {
    const { container } = render(<FAQ />);
    const text = container.textContent ?? "";
    for (const item of FAQ_ITEMS) {
      expect(text).toContain(item.answer);
    }
  });

  it("covers the questions the brief asks for", () => {
    const questions = FAQ_ITEMS.map((i) => i.question.toLowerCase()).join("\n");
    expect(questions).toMatch(/languages/);
    expect(questions).toMatch(/browser/);
    expect(questions).toMatch(/voice/);
    expect(questions).toMatch(/mobile/);
    expect(questions).toMatch(/cancel/);
  });

  it("names every supported language in the languages answer", () => {
    const answer = FAQ_ITEMS.find((i) => /languages/i.test(i.question))!.answer;
    for (const language of LANGUAGES) {
      expect(answer).toContain(language.label);
    }
  });

  it("recommends Chrome or Edge and mentions the microphone", () => {
    const answer = FAQ_ITEMS.find((i) => /browser/i.test(i.question))!.answer;
    expect(answer).toMatch(/Chrome/);
    expect(answer).toMatch(/Edge/);
    expect(answer).toMatch(/microphone/i);
  });

  it("uses native disclosure elements so answers work without JavaScript", () => {
    const { container } = render(<FAQ />);
    expect(container.querySelectorAll("details")).toHaveLength(FAQ_ITEMS.length);
  });
});
