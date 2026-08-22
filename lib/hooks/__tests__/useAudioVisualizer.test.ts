/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { useAudioVisualizer } from "../useAudioVisualizer";

/** Stand-ins for the Web Audio nodes the hook wires together. */
class MockAnalyser {
  fftSize = 2048;
  smoothingTimeConstant = 0;
  /** Mirrors the real API: frequencyBinCount is always fftSize / 2. */
  get frequencyBinCount() {
    return this.fftSize / 2;
  }
  getByteFrequencyData = jest.fn((array: Uint8Array) => {
    array.fill(128);
  });
}

class MockSource {
  connect = jest.fn();
  disconnect = jest.fn();
}

class MockAudioContext {
  static instances: MockAudioContext[] = [];

  state: AudioContextState = "running";
  analyser = new MockAnalyser();
  source = new MockSource();

  createAnalyser = jest.fn(() => this.analyser);
  createMediaStreamSource = jest.fn(() => this.source);
  close = jest.fn(() => {
    this.state = "closed";
    return Promise.resolve();
  });

  constructor() {
    MockAudioContext.instances.push(this);
  }

  static get last() {
    return this.instances[this.instances.length - 1];
  }
}

const stream = {} as MediaStream;

let rafSpy: jest.SpyInstance;
let cafSpy: jest.SpyInstance;

beforeEach(() => {
  MockAudioContext.instances = [];
  (window as unknown as { AudioContext: unknown }).AudioContext = MockAudioContext;

  // Run exactly one animation frame per scheduled callback so the render loop
  // does not recurse forever inside a synchronous test.
  let pending: FrameRequestCallback | null = null;
  let handle = 0;
  rafSpy = jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    pending = cb;
    return ++handle;
  });
  cafSpy = jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {
    pending = null;
  });
  (globalThis as unknown as { __flushFrame: () => void }).__flushFrame = () => {
    const cb = pending;
    pending = null;
    cb?.(0);
  };
});

afterEach(() => {
  rafSpy.mockRestore();
  cafSpy.mockRestore();
  delete (window as unknown as { AudioContext?: unknown }).AudioContext;
});

function flushFrame() {
  act(() => {
    (globalThis as unknown as { __flushFrame: () => void }).__flushFrame();
  });
}

describe("initial state", () => {
  it("exposes a 32-bin silent buffer before analysis starts", () => {
    const { result } = renderHook(() => useAudioVisualizer());

    expect(result.current.analyserData).toBeInstanceOf(Uint8Array);
    expect(result.current.analyserData).toHaveLength(32);
    expect(Array.from(result.current.analyserData).every((v) => v === 0)).toBe(true);
  });
});

describe("startAnalyser", () => {
  it("builds an analyser from the incoming media stream", () => {
    const { result } = renderHook(() => useAudioVisualizer());

    act(() => result.current.startAnalyser(stream));

    const ctx = MockAudioContext.last;
    expect(ctx.createMediaStreamSource).toHaveBeenCalledWith(stream);
    expect(ctx.source.connect).toHaveBeenCalledWith(ctx.analyser);
  });

  it("configures a 64-point FFT with smoothing for a stable meter", () => {
    const { result } = renderHook(() => useAudioVisualizer());

    act(() => result.current.startAnalyser(stream));

    expect(MockAudioContext.last.analyser.fftSize).toBe(64);
    expect(MockAudioContext.last.analyser.smoothingTimeConstant).toBe(0.8);
  });

  it("publishes frequency data sized to the FFT bin count", () => {
    const { result } = renderHook(() => useAudioVisualizer());

    act(() => result.current.startAnalyser(stream));

    expect(result.current.analyserData).toHaveLength(32);
    expect(Array.from(result.current.analyserData).every((v) => v === 128)).toBe(true);
  });

  it("keeps sampling on every animation frame", () => {
    const { result } = renderHook(() => useAudioVisualizer());

    act(() => result.current.startAnalyser(stream));
    const analyser = MockAudioContext.last.analyser;
    const callsAfterStart = analyser.getByteFrequencyData.mock.calls.length;

    flushFrame();

    expect(analyser.getByteFrequencyData.mock.calls.length).toBeGreaterThan(
      callsAfterStart
    );
  });

  it("copies the buffer each frame so React sees a new value", () => {
    const { result } = renderHook(() => useAudioVisualizer());

    act(() => result.current.startAnalyser(stream));
    const first = result.current.analyserData;

    MockAudioContext.last.analyser.getByteFrequencyData.mockImplementationOnce(
      (array: Uint8Array) => array.fill(200)
    );
    flushFrame();

    expect(result.current.analyserData).not.toBe(first);
    expect(result.current.analyserData[0]).toBe(200);
  });

  it("swallows the error when AudioContext is unavailable", () => {
    delete (window as unknown as { AudioContext?: unknown }).AudioContext;
    const { result } = renderHook(() => useAudioVisualizer());

    expect(() => act(() => result.current.startAnalyser(stream))).not.toThrow();
    expect(result.current.analyserData).toHaveLength(32);
  });

  it("swallows the error when the stream cannot be sourced", () => {
    const { result } = renderHook(() => useAudioVisualizer());
    const failing = class extends MockAudioContext {
      createMediaStreamSource = jest.fn(() => {
        throw new Error("invalid stream");
      });
    };
    (window as unknown as { AudioContext: unknown }).AudioContext = failing;

    expect(() => act(() => result.current.startAnalyser(stream))).not.toThrow();
  });
});

describe("stopAnalyser", () => {
  it("cancels the render loop", () => {
    const { result } = renderHook(() => useAudioVisualizer());
    act(() => result.current.startAnalyser(stream));

    act(() => result.current.stopAnalyser());

    expect(cafSpy).toHaveBeenCalled();
  });

  it("disconnects the source and closes the context", () => {
    const { result } = renderHook(() => useAudioVisualizer());
    act(() => result.current.startAnalyser(stream));
    const ctx = MockAudioContext.last;

    act(() => result.current.stopAnalyser());

    expect(ctx.source.disconnect).toHaveBeenCalled();
    expect(ctx.close).toHaveBeenCalled();
  });

  it("resets the meter to a silent 32-bin buffer", () => {
    const { result } = renderHook(() => useAudioVisualizer());
    act(() => result.current.startAnalyser(stream));

    act(() => result.current.stopAnalyser());

    expect(result.current.analyserData).toHaveLength(32);
    expect(Array.from(result.current.analyserData).every((v) => v === 0)).toBe(true);
  });

  it("is safe to call before starting", () => {
    const { result } = renderHook(() => useAudioVisualizer());
    expect(() => act(() => result.current.stopAnalyser())).not.toThrow();
  });

  it("is idempotent and does not double-close the context", () => {
    const { result } = renderHook(() => useAudioVisualizer());
    act(() => result.current.startAnalyser(stream));
    const ctx = MockAudioContext.last;

    act(() => result.current.stopAnalyser());
    act(() => result.current.stopAnalyser());

    expect(ctx.close).toHaveBeenCalledTimes(1);
  });

  it("can restart after stopping, on a fresh context", () => {
    const { result } = renderHook(() => useAudioVisualizer());

    act(() => result.current.startAnalyser(stream));
    act(() => result.current.stopAnalyser());
    act(() => result.current.startAnalyser(stream));

    expect(MockAudioContext.instances).toHaveLength(2);
    expect(MockAudioContext.last.state).toBe("running");
  });
});

describe("cleanup", () => {
  it("tears down the audio graph on unmount", () => {
    const { result, unmount } = renderHook(() => useAudioVisualizer());
    act(() => result.current.startAnalyser(stream));
    const ctx = MockAudioContext.last;

    unmount();

    expect(cafSpy).toHaveBeenCalled();
    expect(ctx.source.disconnect).toHaveBeenCalled();
    expect(ctx.close).toHaveBeenCalled();
  });

  it("does not close a context that is already closed", () => {
    const { result, unmount } = renderHook(() => useAudioVisualizer());
    act(() => result.current.startAnalyser(stream));
    const ctx = MockAudioContext.last;
    act(() => result.current.stopAnalyser());

    unmount();

    expect(ctx.close).toHaveBeenCalledTimes(1);
  });

  it("unmounts cleanly when the analyser never started", () => {
    const { unmount } = renderHook(() => useAudioVisualizer());
    expect(() => unmount()).not.toThrow();
  });
});
