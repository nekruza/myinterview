function send(label: string, value: number, currency: string) {
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== "function") return false;
  gtag("event", "conversion", {
    send_to: `AW-18065580102/${label}`,
    value,
    currency,
    transport_type: "beacon",
  });
  return true;
}

function fireWithRetry(label: string, value: number, currency: string) {
  if (typeof window === "undefined") return;
  if (send(label, value, currency)) return;

  // gtag not yet loaded — retry up to 5s
  let attempts = 0;
  const id = setInterval(() => {
    if (send(label, value, currency) || ++attempts >= 10) clearInterval(id);
  }, 500);
}

export function fireConversion() {
  fireWithRetry("vf0cCKDS25McENbPi6JD", 39.0, "GBP");
}

export function fireSignupConversion() {
  fireWithRetry("19ZqCOyL2pUcENbPi6JD", 0, "GBP");
}
