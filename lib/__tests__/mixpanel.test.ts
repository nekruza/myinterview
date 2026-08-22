/**
 * @jest-environment jsdom
 */
import mixpanel from "mixpanel-browser";

jest.mock("mixpanel-browser", () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    track: jest.fn(),
    identify: jest.fn(),
    alias: jest.fn(),
    reset: jest.fn(),
    people: { set: jest.fn() },
  },
}));

const mp = mixpanel as unknown as {
  init: jest.Mock;
  track: jest.Mock;
  identify: jest.Mock;
  alias: jest.Mock;
  reset: jest.Mock;
  people: { set: jest.Mock };
};

/**
 * The module keeps an `initialized` flag in module scope, so each test needs a
 * fresh copy to control whether init has run.
 */
function loadModule() {
  let mod!: typeof import("../mixpanel");
  jest.isolateModules(() => {
    // isolateModules needs a runtime require to get a fresh module copy.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require("../mixpanel");
  });
  return mod;
}

const ORIGINAL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

afterEach(() => {
  if (ORIGINAL_TOKEN === undefined) delete process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  else process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = ORIGINAL_TOKEN;
});

describe("initMixpanel", () => {
  it("initialises with the EU api host and session recording", () => {
    process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = "tok-123";
    const { initMixpanel } = loadModule();

    initMixpanel();

    expect(mp.init).toHaveBeenCalledWith("tok-123", {
      autocapture: true,
      record_sessions_percent: 100,
      api_host: "https://api-eu.mixpanel.com",
    });
  });

  it("keeps data in the EU for GDPR", () => {
    process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = "tok-123";
    loadModule().initMixpanel();

    expect(mp.init.mock.calls[0][1].api_host).toContain("api-eu.");
  });

  it("is a no-op when the token is not configured", () => {
    delete process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
    loadModule().initMixpanel();

    expect(mp.init).not.toHaveBeenCalled();
  });

  it("is a no-op when the token is an empty string", () => {
    process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = "";
    loadModule().initMixpanel();

    expect(mp.init).not.toHaveBeenCalled();
  });

  it("initialises only once even if called repeatedly", () => {
    process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = "tok-123";
    const { initMixpanel } = loadModule();

    initMixpanel();
    initMixpanel();
    initMixpanel();

    expect(mp.init).toHaveBeenCalledTimes(1);
  });
});

describe("before init", () => {
  it("drops track, identify, alias and reset calls silently", () => {
    delete process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
    const m = loadModule();
    m.initMixpanel(); // no token, so stays uninitialised

    m.track("Signed Up");
    m.identify("u1", "a@b.com");
    m.aliasUser("u1");
    m.resetMixpanel();

    expect(mp.track).not.toHaveBeenCalled();
    expect(mp.identify).not.toHaveBeenCalled();
    expect(mp.alias).not.toHaveBeenCalled();
    expect(mp.reset).not.toHaveBeenCalled();
  });

  it("does not throw when analytics is disabled", () => {
    delete process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
    const m = loadModule();

    expect(() => {
      m.track("Signed Up");
      m.identify("u1", "a@b.com");
      m.aliasUser("u1");
      m.resetMixpanel();
    }).not.toThrow();
  });
});

describe("after init", () => {
  function initialised() {
    process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = "tok-123";
    const m = loadModule();
    m.initMixpanel();
    return m;
  }

  it("forwards an event with no properties", () => {
    initialised().track("Session Started");
    expect(mp.track).toHaveBeenCalledWith("Session Started", undefined);
  });

  it("forwards an event with properties", () => {
    initialised().track("Session Completed", { duration: 300, topic: "leadership" });
    expect(mp.track).toHaveBeenCalledWith("Session Completed", {
      duration: 300,
      topic: "leadership",
    });
  });

  it("identifies the user and sets their email on the profile", () => {
    initialised().identify("user-1", "test@example.com");

    expect(mp.identify).toHaveBeenCalledWith("user-1");
    expect(mp.people.set).toHaveBeenCalledWith({ $email: "test@example.com" });
  });

  it("aliases the anonymous device id to the user id", () => {
    initialised().aliasUser("user-1");
    expect(mp.alias).toHaveBeenCalledWith("user-1");
  });

  it("swallows the error when alias is called twice for the same user", () => {
    const m = initialised();
    mp.alias.mockImplementationOnce(() => {
      throw new Error("alias already called");
    });

    expect(() => m.aliasUser("user-1")).not.toThrow();
  });

  it("resets the distinct id on logout", () => {
    initialised().resetMixpanel();
    expect(mp.reset).toHaveBeenCalledTimes(1);
  });
});
