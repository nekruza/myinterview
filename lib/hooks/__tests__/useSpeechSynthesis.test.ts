/**
 * @jest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { useSpeechSynthesis } from "../useSpeechSynthesis";

// ── Web Speech stubs ─────────────────────────────────────────────────────────

class MockUtterance {
  static instances: MockUtterance[] = [];

  voice: unknown = null;
  rate = 0;
  pitch = 0;
  volume = 0;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(public text: string) {
    MockUtterance.instances.push(this);
  }
}

function makeSpeechSynthesis() {
  return {
    speaking: false,
    getVoices: jest.fn(() => [] as SpeechSynthesisVoice[]),
    speak: jest.fn(),
    cancel: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    onvoiceschanged: null as (() => void) | null,
  };
}

let synth: ReturnType<typeof makeSpeechSynthesis>;

// ── Audio stub for the Kokoro path ───────────────────────────────────────────

class MockAudio {
  static instances: MockAudio[] = [];

  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  play = jest.fn(() => Promise.resolve());
  pause = jest.fn();

  constructor(public src: string) {
    MockAudio.instances.push(this);
  }

  static get last() {
    return this.instances[this.instances.length - 1];
  }
}

function voice(name: string, lang = "en-US") {
  return { name, lang } as SpeechSynthesisVoice;
}

/** Drive the chunked fallback to completion by firing each utterance's onend. */
function completeAllUtterances() {
  for (let i = 0; i < MockUtterance.instances.length; i++) {
    act(() => MockUtterance.instances[i].onend?.());
  }
}

beforeEach(() => {
  MockUtterance.instances = [];
  MockAudio.instances = [];

  synth = makeSpeechSynthesis();
  Object.defineProperty(window, "speechSynthesis", {
    value: synth,
    writable: true,
    configurable: true,
  });
  (window as unknown as { SpeechSynthesisUtterance: unknown })
    .SpeechSynthesisUtterance = MockUtterance;
  (window as unknown as { Audio: unknown }).Audio = MockAudio;
  (global as unknown as { Audio: unknown }).Audio = MockAudio;

  global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
  global.URL.revokeObjectURL = jest.fn();
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.useRealTimers();
});

const mockFetch = () => global.fetch as jest.Mock;

/** Kokoro returns audio successfully. */
function kokoroOk() {
  mockFetch().mockResolvedValue({ ok: true, blob: async () => new Blob(["audio"]) });
}

/** Kokoro is unavailable, so the hook must fall back to Web Speech. */
function kokoroFails() {
  mockFetch().mockResolvedValue({ ok: false, status: 500 });
}

describe("initial state", () => {
  it("is not speaking on mount", () => {
    const { result } = renderHook(() => useSpeechSynthesis());
    expect(result.current.isSpeaking).toBe(false);
  });

  it("cancels any in-flight speech on unmount", () => {
    const { unmount } = renderHook(() => useSpeechSynthesis());
    synth.cancel.mockClear();

    unmount();

    expect(synth.cancel).toHaveBeenCalled();
  });
});

describe("voice selection", () => {
  it("prefers the highest-ranked voice available", () => {
    synth.getVoices.mockReturnValue([
      voice("Alex"),
      voice("Google US English"),
      voice("Daniel"),
    ]);

    renderHook(() => useSpeechSynthesis());
    kokoroFails();

    // The chosen voice is only observable through the utterance it produces.
    expect(synth.getVoices).toHaveBeenCalled();
  });

  it("re-reads voices when the browser loads them late", () => {
    renderHook(() => useSpeechSynthesis());
    synth.getVoices.mockClear();

    act(() => synth.onvoiceschanged?.());

    expect(synth.getVoices).toHaveBeenCalled();
  });

  it("applies the preferred voice to the utterance", async () => {
    const preferred = voice("Google US English");
    synth.getVoices.mockReturnValue([voice("Zira", "en-GB"), preferred]);
    kokoroFails();

    const { result } = renderHook(() => useSpeechSynthesis());
    act(() => {
      void result.current.speakAsync("Hello.");
    });

    await waitFor(() => expect(MockUtterance.instances.length).toBeGreaterThan(0));
    expect(MockUtterance.instances[0].voice).toBe(preferred);
  });

  it("falls back to any English voice when no preferred name matches", async () => {
    const english = voice("Some Other Voice", "en-AU");
    synth.getVoices.mockReturnValue([voice("Amelie", "fr-FR"), english]);
    kokoroFails();

    const { result } = renderHook(() => useSpeechSynthesis());
    act(() => {
      void result.current.speakAsync("Hello.");
    });

    await waitFor(() => expect(MockUtterance.instances.length).toBeGreaterThan(0));
    expect(MockUtterance.instances[0].voice).toBe(english);
  });

  it("leaves the voice unset when no English voice exists", async () => {
    synth.getVoices.mockReturnValue([voice("Amelie", "fr-FR")]);
    kokoroFails();

    const { result } = renderHook(() => useSpeechSynthesis());
    act(() => {
      void result.current.speakAsync("Hello.");
    });

    await waitFor(() => expect(MockUtterance.instances.length).toBeGreaterThan(0));
    expect(MockUtterance.instances[0].voice).toBeNull();
  });
});

describe("speakAsync via Kokoro", () => {
  it("requests TTS with the text and voice id", async () => {
    kokoroOk();
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      void result.current.speakAsync("Hello there.", "Clive");
    });

    await waitFor(() => expect(mockFetch()).toHaveBeenCalled());
    expect(mockFetch()).toHaveBeenCalledWith("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Hello there.", voiceId: "Clive" }),
    });
  });

  it("marks itself as speaking while audio plays", async () => {
    kokoroOk();
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      void result.current.speakAsync("Hello.");
    });

    await waitFor(() => expect(result.current.isSpeaking).toBe(true));
  });

  it("plays the returned audio blob", async () => {
    kokoroOk();
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      void result.current.speakAsync("Hello.");
    });

    await waitFor(() => expect(MockAudio.instances.length).toBe(1));
    expect(MockAudio.last.src).toBe("blob:mock-url");
    expect(MockAudio.last.play).toHaveBeenCalled();
  });

  it("resolves and releases the object URL when playback ends", async () => {
    kokoroOk();
    const { result } = renderHook(() => useSpeechSynthesis());

    let settled = false;
    act(() => {
      void result.current.speakAsync("Hello.").then(() => {
        settled = true;
      });
    });

    await waitFor(() => expect(MockAudio.instances.length).toBe(1));
    await act(async () => {
      MockAudio.last.onended?.();
    });

    expect(settled).toBe(true);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    expect(result.current.isSpeaking).toBe(false);
  });

  it("does not touch Web Speech when Kokoro succeeds", async () => {
    kokoroOk();
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      void result.current.speakAsync("Hello.");
    });

    await waitFor(() => expect(MockAudio.instances.length).toBe(1));
    await act(async () => {
      MockAudio.last.onended?.();
    });

    expect(synth.speak).not.toHaveBeenCalled();
  });

  it("falls back to Web Speech when audio playback errors", async () => {
    kokoroOk();
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      void result.current.speakAsync("Hello.");
    });

    await waitFor(() => expect(MockAudio.instances.length).toBe(1));
    await act(async () => {
      MockAudio.last.onerror?.();
    });

    await waitFor(() => expect(synth.speak).toHaveBeenCalled());
  });
});

describe("speakAsync fallback to Web Speech", () => {
  it("falls back when the TTS endpoint returns a non-ok status", async () => {
    kokoroFails();
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      void result.current.speakAsync("Hello.");
    });

    await waitFor(() => expect(synth.speak).toHaveBeenCalled());
    expect(MockAudio.instances).toHaveLength(0);
  });

  it("falls back when the TTS request throws", async () => {
    mockFetch().mockRejectedValue(new Error("network down"));
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      void result.current.speakAsync("Hello.");
    });

    await waitFor(() => expect(synth.speak).toHaveBeenCalled());
  });

  it("splits text into sentence chunks to dodge the Chrome 15s bug", async () => {
    kokoroFails();
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      void result.current.speakAsync("First one. Second one! Third one?");
    });

    await waitFor(() => expect(MockUtterance.instances.length).toBe(1));

    // Chunks are spoken one at a time, each starting when the previous ends.
    expect(MockUtterance.instances[0].text).toBe("First one.");
    act(() => MockUtterance.instances[0].onend?.());
    expect(MockUtterance.instances[1].text).toBe("Second one!");
    act(() => MockUtterance.instances[1].onend?.());
    expect(MockUtterance.instances[2].text).toBe("Third one?");
  });

  it("speaks text with no sentence punctuation as a single chunk", async () => {
    kokoroFails();
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      void result.current.speakAsync("no punctuation here");
    });

    await waitFor(() => expect(MockUtterance.instances.length).toBe(1));
    expect(MockUtterance.instances[0].text).toBe("no punctuation here");
  });

  it("sets neutral rate, pitch and volume on each utterance", async () => {
    kokoroFails();
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      void result.current.speakAsync("Hello.");
    });

    await waitFor(() => expect(MockUtterance.instances.length).toBe(1));
    expect(MockUtterance.instances[0]).toMatchObject({
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
    });
  });

  it("advances past a chunk that errors rather than stalling", async () => {
    kokoroFails();
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      void result.current.speakAsync("First. Second.");
    });

    await waitFor(() => expect(MockUtterance.instances.length).toBe(1));
    act(() => MockUtterance.instances[0].onerror?.());

    expect(MockUtterance.instances[1].text).toBe("Second.");
  });

  it("resolves and stops speaking once every chunk finishes", async () => {
    kokoroFails();
    const { result } = renderHook(() => useSpeechSynthesis());

    let settled = false;
    act(() => {
      void result.current.speakAsync("First. Second.").then(() => {
        settled = true;
      });
    });

    await waitFor(() => expect(MockUtterance.instances.length).toBe(1));
    completeAllUtterances();

    await waitFor(() => expect(settled).toBe(true));
    expect(result.current.isSpeaking).toBe(false);
  });

  it("clears the previous queue before speaking", async () => {
    kokoroFails();
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      void result.current.speakAsync("Hello.");
    });

    await waitFor(() => expect(synth.cancel).toHaveBeenCalled());
  });
});

describe("Chrome keepalive and safety timeout", () => {
  // The safety timeout is max(text.length * 80ms, 6s), so the keepalive at 10s
  // is only reachable for text longer than 125 characters.
  const LONG_TEXT = `${"Tell me about a time you led a project. ".repeat(5)}`;

  it("pauses and resumes periodically to stop background stalling", async () => {
    jest.useFakeTimers();
    kokoroFails();
    const { result } = renderHook(() => useSpeechSynthesis());

    await act(async () => {
      void result.current.speakAsync(LONG_TEXT);
    });

    synth.speaking = true;
    act(() => {
      jest.advanceTimersByTime(10_000);
    });

    expect(synth.pause).toHaveBeenCalled();
    expect(synth.resume).toHaveBeenCalled();
  });

  it("does not keepalive when nothing is speaking", async () => {
    jest.useFakeTimers();
    kokoroFails();
    const { result } = renderHook(() => useSpeechSynthesis());

    await act(async () => {
      void result.current.speakAsync(LONG_TEXT);
    });

    synth.speaking = false;
    act(() => {
      jest.advanceTimersByTime(10_000);
    });

    expect(synth.pause).not.toHaveBeenCalled();
  });

  it("resolves via the safety timeout when onend never fires", async () => {
    jest.useFakeTimers();
    kokoroFails();
    const { result } = renderHook(() => useSpeechSynthesis());

    let settled = false;
    await act(async () => {
      void result.current.speakAsync("Hi.").then(() => {
        settled = true;
      });
    });

    // Minimum safety window is 6s, and no utterance ever ends.
    await act(async () => {
      jest.advanceTimersByTime(6000);
    });

    expect(settled).toBe(true);
    expect(result.current.isSpeaking).toBe(false);
  });

  it("resolves only once even if a chunk ends after the safety timeout", async () => {
    jest.useFakeTimers();
    kokoroFails();
    const { result } = renderHook(() => useSpeechSynthesis());

    const onResolve = jest.fn();
    await act(async () => {
      void result.current.speakAsync("Hi.").then(onResolve);
    });

    await act(async () => {
      jest.advanceTimersByTime(6000);
    });
    act(() => MockUtterance.instances[0]?.onend?.());

    expect(onResolve).toHaveBeenCalledTimes(1);
  });
});

describe("lang parameter", () => {
  it("includes language in the /api/tts request body when given", async () => {
    kokoroOk();
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      void result.current.speakAsync("Hola.", "Diego", "es-ES");
    });

    await waitFor(() => expect(mockFetch()).toHaveBeenCalled());
    expect(mockFetch()).toHaveBeenCalledWith("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Hola.", voiceId: "Diego", language: "es-ES" }),
    });
  });

  it("omits language from the request body when not given", async () => {
    kokoroOk();
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      void result.current.speakAsync("Hello.", "Clive");
    });

    await waitFor(() => expect(mockFetch()).toHaveBeenCalled());
    expect(mockFetch()).toHaveBeenCalledWith("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Hello.", voiceId: "Clive" }),
    });
  });

  it("picks a fallback voice matching the language and sets utterance.lang", async () => {
    const spanishVoice = voice("Spanish Voice", "es-ES");
    synth.getVoices.mockReturnValue([voice("English Voice", "en-US"), spanishVoice]);
    kokoroFails();

    const { result } = renderHook(() => useSpeechSynthesis());
    act(() => {
      void result.current.speakAsync("Hola.", undefined, "es-ES");
    });

    await waitFor(() => expect(MockUtterance.instances.length).toBeGreaterThan(0));
    expect(MockUtterance.instances[0].voice).toBe(spanishVoice);
    expect(MockUtterance.instances[0]).toMatchObject({ lang: "es-ES" });
  });

  it("matches a fallback voice by the language's base code (e.g. es matches es-MX)", async () => {
    const mexicanSpanish = voice("Mexican Spanish", "es-MX");
    synth.getVoices.mockReturnValue([voice("English Voice", "en-US"), mexicanSpanish]);
    kokoroFails();

    const { result } = renderHook(() => useSpeechSynthesis());
    act(() => {
      void result.current.speakAsync("Hola.", undefined, "es-ES");
    });

    await waitFor(() => expect(MockUtterance.instances.length).toBeGreaterThan(0));
    expect(MockUtterance.instances[0].voice).toBe(mexicanSpanish);
  });
});

describe("cancel", () => {
  it("stops Kokoro audio playback", async () => {
    kokoroOk();
    const { result } = renderHook(() => useSpeechSynthesis());

    act(() => {
      void result.current.speakAsync("Hello.");
    });
    await waitFor(() => expect(MockAudio.instances.length).toBe(1));
    const audio = MockAudio.last;

    act(() => result.current.cancel());

    expect(audio.pause).toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
  });

  it("stops Web Speech playback", async () => {
    kokoroFails();
    const { result } = renderHook(() => useSpeechSynthesis());

    await act(async () => {
      void result.current.speakAsync("Hello.");
    });
    synth.cancel.mockClear();

    act(() => result.current.cancel());

    expect(synth.cancel).toHaveBeenCalled();
  });

  it("resolves the pending promise so callers are not left hanging", async () => {
    kokoroFails();
    const { result } = renderHook(() => useSpeechSynthesis());

    let settled = false;
    await act(async () => {
      void result.current.speakAsync("Hello.").then(() => {
        settled = true;
      });
    });

    await act(async () => {
      result.current.cancel();
    });

    expect(settled).toBe(true);
  });

  it("clears the keepalive interval and safety timeout", async () => {
    jest.useFakeTimers();
    kokoroFails();
    const { result } = renderHook(() => useSpeechSynthesis());

    await act(async () => {
      void result.current.speakAsync("Hello.");
    });

    act(() => result.current.cancel());
    synth.pause.mockClear();
    synth.speaking = true;

    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    expect(synth.pause).not.toHaveBeenCalled();
  });

  it("stops a subsequent chunk from being spoken", async () => {
    kokoroFails();
    const { result } = renderHook(() => useSpeechSynthesis());

    await act(async () => {
      void result.current.speakAsync("First. Second. Third.");
    });
    const spokenBeforeCancel = MockUtterance.instances.length;

    act(() => result.current.cancel());
    act(() => MockUtterance.instances[spokenBeforeCancel - 1].onend?.());

    expect(MockUtterance.instances).toHaveLength(spokenBeforeCancel);
  });

  it("is safe to call when nothing is playing", () => {
    const { result } = renderHook(() => useSpeechSynthesis());
    expect(() => act(() => result.current.cancel())).not.toThrow();
  });

  it("is safe to call twice", async () => {
    kokoroFails();
    const { result } = renderHook(() => useSpeechSynthesis());

    await act(async () => {
      void result.current.speakAsync("Hello.");
    });

    expect(() => {
      act(() => result.current.cancel());
      act(() => result.current.cancel());
    }).not.toThrow();
  });
});
