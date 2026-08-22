/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { useSpeechRecognition } from "../useSpeechRecognition";

/** Minimal stand-in for the browser SpeechRecognition instance. */
class MockSpeechRecognition {
  static instances: MockSpeechRecognition[] = [];

  continuous = false;
  interimResults = false;
  lang = "";
  onresult: ((event: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;

  start = jest.fn();
  stop = jest.fn();
  abort = jest.fn();

  constructor() {
    MockSpeechRecognition.instances.push(this);
  }

  static get last() {
    return this.instances[this.instances.length - 1];
  }
}

/** Build the shape the hook reads off SpeechRecognitionEvent. */
function resultEvent(
  entries: Array<{ transcript: string; isFinal: boolean }>,
  resultIndex = 0
) {
  const results = entries.map((e) => {
    const alternatives = [{ transcript: e.transcript }];
    return Object.assign(alternatives, { isFinal: e.isFinal });
  });
  return { resultIndex, results: Object.assign(results, { length: results.length }) };
}

function installSpeechRecognition() {
  (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition =
    MockSpeechRecognition;
}

function removeSpeechRecognition() {
  delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
  delete (window as unknown as { webkitSpeechRecognition?: unknown })
    .webkitSpeechRecognition;
}

beforeEach(() => {
  MockSpeechRecognition.instances = [];
  installSpeechRecognition();
});

afterEach(removeSpeechRecognition);

describe("support detection", () => {
  it("reports supported when the standard API exists", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.isSupported).toBe(true);
  });

  it("reports supported via the webkit-prefixed API", () => {
    removeSpeechRecognition();
    (window as unknown as { webkitSpeechRecognition: unknown })
      .webkitSpeechRecognition = MockSpeechRecognition;

    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.isSupported).toBe(true);
  });

  it("reports unsupported when neither API exists", () => {
    removeSpeechRecognition();
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.isSupported).toBe(false);
  });

  it("does nothing on start when unsupported", () => {
    removeSpeechRecognition();
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => result.current.startListening());

    expect(result.current.isListening).toBe(false);
    expect(MockSpeechRecognition.instances).toHaveLength(0);
  });
});

describe("initial state", () => {
  it("starts idle with empty transcripts and no error", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    expect(result.current.transcript).toBe("");
    expect(result.current.finalTranscript).toBe("");
    expect(result.current.isListening).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe("startListening", () => {
  it("starts recognition and flips to listening", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => result.current.startListening());

    expect(result.current.isListening).toBe(true);
    expect(MockSpeechRecognition.last.start).toHaveBeenCalled();
  });

  it("configures continuous interim recognition in English", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => result.current.startListening());

    expect(MockSpeechRecognition.last.continuous).toBe(true);
    expect(MockSpeechRecognition.last.interimResults).toBe(true);
    expect(MockSpeechRecognition.last.lang).toBe("en-US");
  });

  it("reuses one recognition instance across restarts", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => result.current.startListening());
    act(() => result.current.stopListening());
    act(() => result.current.startListening());

    expect(MockSpeechRecognition.instances).toHaveLength(1);
  });

  it("swallows the error when start is called on an already-started instance", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => result.current.startListening());
    MockSpeechRecognition.last.start.mockImplementationOnce(() => {
      throw new Error("already started");
    });

    expect(() => act(() => result.current.startListening())).not.toThrow();
    expect(result.current.isListening).toBe(true);
  });

  it("clears a previous transcript and error when starting again", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => result.current.startListening());
    act(() =>
      MockSpeechRecognition.last.onresult?.(
        resultEvent([{ transcript: "old answer", isFinal: true }])
      )
    );
    expect(result.current.finalTranscript).toBe("old answer");

    act(() => result.current.startListening());

    expect(result.current.finalTranscript).toBe("");
    expect(result.current.transcript).toBe("");
    expect(result.current.error).toBeNull();
  });
});

describe("transcription", () => {
  it("exposes interim results on transcript", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.startListening());

    act(() =>
      MockSpeechRecognition.last.onresult?.(
        resultEvent([{ transcript: "hello wor", isFinal: false }])
      )
    );

    expect(result.current.transcript).toBe("hello wor");
    expect(result.current.finalTranscript).toBe("");
  });

  it("moves a finalised result to finalTranscript and clears the interim", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.startListening());

    act(() =>
      MockSpeechRecognition.last.onresult?.(
        resultEvent([{ transcript: "hello world.", isFinal: true }])
      )
    );

    expect(result.current.finalTranscript).toBe("hello world.");
    expect(result.current.transcript).toBe("");
  });

  it("accumulates successive final results", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.startListening());

    act(() =>
      MockSpeechRecognition.last.onresult?.(
        resultEvent([{ transcript: "First part. ", isFinal: true }])
      )
    );
    act(() =>
      MockSpeechRecognition.last.onresult?.(
        resultEvent([{ transcript: "Second part.", isFinal: true }])
      )
    );

    expect(result.current.finalTranscript).toBe("First part. Second part.");
  });

  it("only reads results from resultIndex onward", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.startListening());

    act(() =>
      MockSpeechRecognition.last.onresult?.(
        resultEvent(
          [
            { transcript: "already delivered", isFinal: true },
            { transcript: "new text", isFinal: true },
          ],
          1
        )
      )
    );

    expect(result.current.finalTranscript).toBe("new text");
  });

  it("concatenates multiple final segments in one event", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.startListening());

    act(() =>
      MockSpeechRecognition.last.onresult?.(
        resultEvent([
          { transcript: "one ", isFinal: true },
          { transcript: "two", isFinal: true },
        ])
      )
    );

    expect(result.current.finalTranscript).toBe("one two");
  });
});

describe("stopListening", () => {
  it("stops recognition and clears the listening flag", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.startListening());

    act(() => result.current.stopListening());

    expect(result.current.isListening).toBe(false);
    expect(MockSpeechRecognition.last.stop).toHaveBeenCalled();
  });

  it("is safe to call before ever starting", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    expect(() => act(() => result.current.stopListening())).not.toThrow();
  });

  it("swallows an error thrown by stop", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.startListening());
    MockSpeechRecognition.last.stop.mockImplementationOnce(() => {
      throw new Error("invalid state");
    });

    expect(() => act(() => result.current.stopListening())).not.toThrow();
    expect(result.current.isListening).toBe(false);
  });
});

describe("auto-restart on end", () => {
  it("restarts when the browser stops it mid-session", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.startListening());

    const recognition = MockSpeechRecognition.last;
    recognition.start.mockClear();

    act(() => recognition.onend?.());

    expect(recognition.start).toHaveBeenCalledTimes(1);
    expect(result.current.isListening).toBe(true);
  });

  it("does not restart after an intentional stop", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.startListening());
    act(() => result.current.stopListening());

    const recognition = MockSpeechRecognition.last;
    recognition.start.mockClear();

    act(() => recognition.onend?.());

    expect(recognition.start).not.toHaveBeenCalled();
    expect(result.current.isListening).toBe(false);
  });

  it("swallows an error thrown by the auto-restart", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.startListening());

    const recognition = MockSpeechRecognition.last;
    recognition.start.mockImplementationOnce(() => {
      throw new Error("already started");
    });

    expect(() => act(() => recognition.onend?.())).not.toThrow();
  });
});

describe("error handling", () => {
  it("surfaces a friendly message and stops on a denied microphone", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.startListening());

    act(() => MockSpeechRecognition.last.onerror?.({ error: "not-allowed" }));

    expect(result.current.error).toBe(
      "Microphone access denied. Please allow microphone access."
    );
    expect(result.current.isListening).toBe(false);
  });

  it("does not auto-restart after a permission denial", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.startListening());

    const recognition = MockSpeechRecognition.last;
    act(() => recognition.onerror?.({ error: "not-allowed" }));
    recognition.start.mockClear();
    act(() => recognition.onend?.());

    expect(recognition.start).not.toHaveBeenCalled();
  });

  it("treats silence as normal and keeps listening", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.startListening());

    act(() => MockSpeechRecognition.last.onerror?.({ error: "no-speech" }));

    expect(result.current.error).toBeNull();
    expect(result.current.isListening).toBe(true);
  });

  it("ignores an aborted event from an intentional stop", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.startListening());

    act(() => MockSpeechRecognition.last.onerror?.({ error: "aborted" }));

    expect(result.current.error).toBeNull();
  });

  it("reports any other error verbatim", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.startListening());

    act(() => MockSpeechRecognition.last.onerror?.({ error: "network" }));

    expect(result.current.error).toBe("Speech recognition error: network");
  });
});

describe("resetTranscript", () => {
  it("clears both transcripts", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.startListening());
    act(() =>
      MockSpeechRecognition.last.onresult?.(
        resultEvent([{ transcript: "some answer", isFinal: true }])
      )
    );

    act(() => result.current.resetTranscript());

    expect(result.current.transcript).toBe("");
    expect(result.current.finalTranscript).toBe("");
  });

  it("does not stop an in-flight session", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.startListening());

    act(() => result.current.resetTranscript());

    expect(result.current.isListening).toBe(true);
    expect(MockSpeechRecognition.last.stop).not.toHaveBeenCalled();
  });
});

describe("cleanup", () => {
  it("aborts recognition on unmount so the mic is released", () => {
    const { result, unmount } = renderHook(() => useSpeechRecognition());
    act(() => result.current.startListening());
    const recognition = MockSpeechRecognition.last;

    unmount();

    expect(recognition.abort).toHaveBeenCalled();
  });

  it("does not throw when abort fails on unmount", () => {
    const { result, unmount } = renderHook(() => useSpeechRecognition());
    act(() => result.current.startListening());
    MockSpeechRecognition.last.abort.mockImplementationOnce(() => {
      throw new Error("invalid state");
    });

    expect(() => unmount()).not.toThrow();
  });

  it("unmounts cleanly when recognition was never created", () => {
    const { unmount } = renderHook(() => useSpeechRecognition());
    expect(() => unmount()).not.toThrow();
  });
});
