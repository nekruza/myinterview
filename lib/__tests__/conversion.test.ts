/**
 * @jest-environment jsdom
 */
import {
  fireConversion,
  fireSignupConversion,
  fireSignupConversionOnClick,
} from "../conversion";

const PURCHASE_SEND_TO = "AW-18065580102/vf0cCKDS25McENbPi6JD";
const SIGNUP_SEND_TO = "AW-18056669142/19ZqCOyL2pUcENbPi6JD";

declare global {
  // eslint-disable-next-line no-var
  var gtag: jest.Mock | undefined;
}

function installGtag() {
  const gtag = jest.fn();
  (window as unknown as { gtag: jest.Mock }).gtag = gtag;
  return gtag;
}

/**
 * jsdom marks `window.location` non-configurable, so it cannot be swapped for a
 * spy. It does implement same-document (hash) navigation though, so tests use a
 * hash target to observe the real `location.href` assignment the code performs.
 */
function resetLocation() {
  window.location.href = "#";
}

function removeGtag() {
  delete (window as unknown as { gtag?: unknown }).gtag;
}

afterEach(() => {
  removeGtag();
  jest.useRealTimers();
});

describe("fireConversion", () => {
  it("sends the purchase conversion with value and currency", () => {
    const gtag = installGtag();

    fireConversion();

    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith("event", "conversion", {
      send_to: PURCHASE_SEND_TO,
      value: 39.0,
      currency: "GBP",
      transport_type: "beacon",
    });
  });

  it("uses beacon transport so the event survives navigation", () => {
    const gtag = installGtag();

    fireConversion();

    expect(gtag.mock.calls[0][2].transport_type).toBe("beacon");
  });

  it("retries on an interval until gtag loads, then stops", () => {
    jest.useFakeTimers();

    fireConversion(); // gtag absent — schedules retries
    jest.advanceTimersByTime(1500);

    const gtag = installGtag();
    jest.advanceTimersByTime(500);

    expect(gtag).toHaveBeenCalledTimes(1);

    // Once it lands the interval is cleared, so no duplicate conversions.
    jest.advanceTimersByTime(5000);
    expect(gtag).toHaveBeenCalledTimes(1);
  });

  it("gives up after 10 retries so the interval cannot leak", () => {
    jest.useFakeTimers();
    const clearSpy = jest.spyOn(global, "clearInterval");

    fireConversion();
    jest.advanceTimersByTime(500 * 10);

    expect(clearSpy).toHaveBeenCalled();

    // A late-loading gtag past the window is not fired at.
    const gtag = installGtag();
    jest.advanceTimersByTime(10_000);
    expect(gtag).not.toHaveBeenCalled();

    clearSpy.mockRestore();
  });

  it("does not throw when gtag never loads", () => {
    jest.useFakeTimers();

    expect(() => {
      fireConversion();
      jest.advanceTimersByTime(10_000);
    }).not.toThrow();
  });
});

describe("fireSignupConversion", () => {
  it("sends the signup conversion", () => {
    const gtag = installGtag();

    fireSignupConversion();

    expect(gtag).toHaveBeenCalledWith("event", "conversion", {
      send_to: SIGNUP_SEND_TO,
      value: 1.0,
      currency: "GBP",
    });
  });

  it("uses a different send_to than the purchase conversion", () => {
    const gtag = installGtag();

    fireSignupConversion();
    fireConversion();

    expect(gtag.mock.calls[0][2].send_to).not.toBe(gtag.mock.calls[1][2].send_to);
  });

  it("is a no-op when gtag is unavailable", () => {
    expect(() => fireSignupConversion()).not.toThrow();
  });

  it("does not retry - unlike the purchase conversion", () => {
    jest.useFakeTimers();

    fireSignupConversion();
    const gtag = installGtag();
    jest.advanceTimersByTime(10_000);

    expect(gtag).not.toHaveBeenCalled();
  });
});

describe("fireSignupConversionOnClick", () => {
  beforeEach(resetLocation);

  it("tracks the conversion and defers navigation to the gtag callback", () => {
    const gtag = installGtag();

    fireSignupConversionOnClick("#dashboard");

    const payload = gtag.mock.calls[0][2];
    expect(payload.send_to).toBe(SIGNUP_SEND_TO);
    expect(payload.value).toBe(1.0);
    expect(payload.currency).toBe("GBP");
    expect(typeof payload.event_callback).toBe("function");

    // Navigation has not happened yet — it waits for the callback so the
    // conversion is recorded before the page unloads.
    expect(window.location.hash).not.toBe("#dashboard");

    payload.event_callback();
    expect(window.location.hash).toBe("#dashboard");
  });

  it("navigates immediately when gtag is unavailable", () => {
    fireSignupConversionOnClick("#dashboard");

    expect(window.location.hash).toBe("#dashboard");
  });

  it("returns false so an inline onclick handler cancels the default action", () => {
    installGtag();
    expect(fireSignupConversionOnClick("#dashboard")).toBe(false);
  });

  it("returns false even without gtag", () => {
    expect(fireSignupConversionOnClick("#dashboard")).toBe(false);
  });

  it("does not navigate when no url is given", () => {
    const gtag = installGtag();

    fireSignupConversionOnClick();
    gtag.mock.calls[0][2].event_callback();

    expect(window.location.hash).toBe("");
  });

  it("still fires the conversion when no url is given", () => {
    const gtag = installGtag();

    fireSignupConversionOnClick();

    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag.mock.calls[0][2].send_to).toBe(SIGNUP_SEND_TO);
  });
});
