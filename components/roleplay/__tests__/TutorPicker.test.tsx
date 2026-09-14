/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { TutorPicker } from "../TutorPicker";
import { TUTORS } from "@/lib/tutors";

// lib/tutors.ts orders TUTORS as [luna, henry, jake].
const [LUNA, HENRY, JAKE] = TUTORS;

describe("TutorPicker", () => {
  it("renders one radio per tutor with image, name, and blurb", () => {
    render(<TutorPicker value={LUNA.id} onChange={jest.fn()} />);

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(TUTORS.length);
    TUTORS.forEach((tutor) => {
      expect(screen.getByText(tutor.name)).toBeInTheDocument();
      expect(screen.getByText(tutor.blurb)).toBeInTheDocument();
    });
  });

  it("marks the selected tutor as checked", () => {
    render(<TutorPicker value={HENRY.id} onChange={jest.fn()} />);

    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toHaveAttribute("aria-checked", "false");
    expect(radios[1]).toHaveAttribute("aria-checked", "true");
    expect(radios[2]).toHaveAttribute("aria-checked", "false");
  });

  describe("roving tabindex", () => {
    it("only the selected radio is tabbable", () => {
      render(<TutorPicker value={HENRY.id} onChange={jest.fn()} />);

      const radios = screen.getAllByRole("radio");
      expect(radios[0]).toHaveAttribute("tabIndex", "-1");
      expect(radios[1]).toHaveAttribute("tabIndex", "0");
      expect(radios[2]).toHaveAttribute("tabIndex", "-1");
    });

    it("moves tabbability to the newly selected tutor when value changes", () => {
      const { rerender } = render(<TutorPicker value={LUNA.id} onChange={jest.fn()} />);
      rerender(<TutorPicker value={JAKE.id} onChange={jest.fn()} />);

      const radios = screen.getAllByRole("radio");
      expect(radios[0]).toHaveAttribute("tabIndex", "-1");
      expect(radios[2]).toHaveAttribute("tabIndex", "0");
    });
  });

  describe("arrow key navigation", () => {
    it("ArrowRight calls onChange with the next tutor and wraps from the last", () => {
      const onChange = jest.fn();
      render(<TutorPicker value={LUNA.id} onChange={onChange} />);
      const radios = screen.getAllByRole("radio");

      fireEvent.keyDown(radios[0], { key: "ArrowRight" });
      expect(onChange).toHaveBeenCalledWith(HENRY.id);

      onChange.mockClear();
      fireEvent.keyDown(radios[2], { key: "ArrowRight" });
      expect(onChange).toHaveBeenCalledWith(LUNA.id);
    });

    it("ArrowDown behaves like ArrowRight", () => {
      const onChange = jest.fn();
      render(<TutorPicker value={LUNA.id} onChange={onChange} />);

      fireEvent.keyDown(screen.getAllByRole("radio")[0], { key: "ArrowDown" });
      expect(onChange).toHaveBeenCalledWith(HENRY.id);
    });

    it("ArrowLeft calls onChange with the previous tutor and wraps from the first", () => {
      const onChange = jest.fn();
      render(<TutorPicker value={LUNA.id} onChange={onChange} />);
      const radios = screen.getAllByRole("radio");

      fireEvent.keyDown(radios[0], { key: "ArrowLeft" });
      expect(onChange).toHaveBeenCalledWith(JAKE.id);

      onChange.mockClear();
      fireEvent.keyDown(radios[1], { key: "ArrowLeft" });
      expect(onChange).toHaveBeenCalledWith(LUNA.id);
    });

    it("ArrowUp behaves like ArrowLeft", () => {
      const onChange = jest.fn();
      render(<TutorPicker value={HENRY.id} onChange={onChange} />);

      fireEvent.keyDown(screen.getAllByRole("radio")[1], { key: "ArrowUp" });
      expect(onChange).toHaveBeenCalledWith(LUNA.id);
    });

    it("Home moves to the first tutor", () => {
      const onChange = jest.fn();
      render(<TutorPicker value={JAKE.id} onChange={onChange} />);

      fireEvent.keyDown(screen.getAllByRole("radio")[2], { key: "Home" });
      expect(onChange).toHaveBeenCalledWith(LUNA.id);
    });

    it("End moves to the last tutor", () => {
      const onChange = jest.fn();
      render(<TutorPicker value={LUNA.id} onChange={onChange} />);

      fireEvent.keyDown(screen.getAllByRole("radio")[0], { key: "End" });
      expect(onChange).toHaveBeenCalledWith(JAKE.id);
    });

    it("moves DOM focus to the newly selected radio", () => {
      const onChange = jest.fn();
      render(<TutorPicker value={LUNA.id} onChange={onChange} />);
      const radios = screen.getAllByRole("radio");

      fireEvent.keyDown(radios[0], { key: "ArrowRight" });

      expect(document.activeElement).toBe(radios[1]);
    });

    it("ignores unrelated keys", () => {
      const onChange = jest.fn();
      render(<TutorPicker value={LUNA.id} onChange={onChange} />);

      fireEvent.keyDown(screen.getAllByRole("radio")[0], { key: "a" });

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  it("calls onChange when a radio is clicked", () => {
    const onChange = jest.fn();
    render(<TutorPicker value={LUNA.id} onChange={onChange} />);

    fireEvent.click(screen.getAllByRole("radio")[1]);

    expect(onChange).toHaveBeenCalledWith(HENRY.id);
  });
});
