/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { useTimer } from "../useTimer";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

/** Advance fake timers inside act so React flushes the state updates. */
function tick(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

describe("useTimer", () => {
  it("starts stopped at zero", () => {
    const { result } = renderHook(() => useTimer());

    expect(result.current.elapsed).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.formatted).toBe("00:00");
  });

  it("counts up one second at a time once started", () => {
    const { result } = renderHook(() => useTimer());

    act(() => result.current.start());
    expect(result.current.isRunning).toBe(true);

    tick(3000);
    expect(result.current.elapsed).toBe(3);
  });

  it("does not advance before a full second has passed", () => {
    const { result } = renderHook(() => useTimer());

    act(() => result.current.start());
    tick(999);

    expect(result.current.elapsed).toBe(0);
  });

  it("ignores a second start so the clock cannot run at double speed", () => {
    const { result } = renderHook(() => useTimer());

    act(() => result.current.start());
    act(() => result.current.start());
    tick(3000);

    expect(result.current.elapsed).toBe(3);
  });

  it("freezes the count on pause", () => {
    const { result } = renderHook(() => useTimer());

    act(() => result.current.start());
    tick(5000);
    act(() => result.current.pause());

    expect(result.current.isRunning).toBe(false);

    tick(10_000);
    expect(result.current.elapsed).toBe(5);
  });

  it("resumes from where it paused", () => {
    const { result } = renderHook(() => useTimer());

    act(() => result.current.start());
    tick(5000);
    act(() => result.current.pause());
    act(() => result.current.start());
    tick(2000);

    expect(result.current.elapsed).toBe(7);
  });

  it("reset stops the clock and returns to zero", () => {
    const { result } = renderHook(() => useTimer());

    act(() => result.current.start());
    tick(42_000);
    act(() => result.current.reset());

    expect(result.current.elapsed).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.formatted).toBe("00:00");

    tick(5000);
    expect(result.current.elapsed).toBe(0);
  });

  it("can be restarted after a reset", () => {
    const { result } = renderHook(() => useTimer());

    act(() => result.current.start());
    tick(3000);
    act(() => result.current.reset());
    act(() => result.current.start());
    tick(2000);

    expect(result.current.elapsed).toBe(2);
  });

  it("is safe to pause when never started", () => {
    const { result } = renderHook(() => useTimer());

    expect(() => act(() => result.current.pause())).not.toThrow();
    expect(result.current.elapsed).toBe(0);
  });

  describe("formatted", () => {
    it.each([
      [0, "00:00"],
      [5, "00:05"],
      [59, "00:59"],
      [60, "01:00"],
      [61, "01:01"],
      [125, "02:05"],
      [600, "10:00"],
      [3599, "59:59"],
    ])("renders %i seconds as %s", (seconds, expected) => {
      const { result } = renderHook(() => useTimer());

      act(() => result.current.start());
      tick(seconds * 1000);

      expect(result.current.formatted).toBe(expected);
    });

    it("keeps counting minutes past an hour rather than wrapping", () => {
      const { result } = renderHook(() => useTimer());

      act(() => result.current.start());
      tick(3600 * 1000);

      expect(result.current.formatted).toBe("60:00");
    });
  });

  it("clears its interval on unmount so it cannot leak", () => {
    const clearSpy = jest.spyOn(global, "clearInterval");
    const { result, unmount } = renderHook(() => useTimer());

    act(() => result.current.start());
    unmount();

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it("keeps stable callback identities across renders", () => {
    const { result, rerender } = renderHook(() => useTimer());
    const first = result.current;

    rerender();

    expect(result.current.start).toBe(first.start);
    expect(result.current.pause).toBe(first.pause);
    expect(result.current.reset).toBe(first.reset);
  });
});
