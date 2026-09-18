/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Features } from "../Features";
import { FinalCta } from "../FinalCta";
import { Hero } from "../Hero";
import { HowItWorks } from "../HowItWorks";

describe("English-first landing page", () => {
  it("makes English speaking the hero promise", () => {
    render(<Hero />);

    expect(screen.getByRole("heading", { name: "Speak English with confidence." })).toBeInTheDocument();
    expect(screen.getByText(/English-first practice for real-life situations/i)).toBeInTheDocument();
    expect(screen.getByText("Hi! What would you like to order today?")).toBeInTheDocument();
    expect(screen.queryByText("¡Hola! ¿Qué te gustaría tomar hoy?")).not.toBeInTheDocument();
  });

  it("uses English examples throughout the supporting sections", () => {
    const { container } = render(
      <>
        <HowItWorks />
        <Features />
        <FinalCta />
      </>
    );
    const text = container.textContent ?? "";

    expect(text).toContain("Choose your English tutor");
    expect(text).toContain("I agree.");
    expect(text).toContain("English words by topic and flashcards");
    expect(text).toContain("Say your first English sentence today.");
    expect(text).not.toContain("Yo soy hambre.");
    expect(text).not.toContain("la tienda de campaña");
    expect(text).not.toContain("On se retrouve à quelle heure");
  });
});
