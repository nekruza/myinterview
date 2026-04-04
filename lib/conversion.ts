export function fireConversion() {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== "function") return;
  gtag("event", "conversion", {
    send_to: "AW-18056669142/vf0cCKDS25McENbPi6JD",
    value: 39.0,
    currency: "GBP",
    transaction_id: "",
    transport_type: "beacon",
  });
}
