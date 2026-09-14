/**
 * @jest-environment jsdom
 */
import { render } from "@testing-library/react";
import {
  buildFaqSchema,
  buildOrganizationSchema,
  buildSoftwareApplicationSchema,
  buildWebsiteSchema,
  JsonLd,
} from "../OrganizationSchema";
import { FAQ_ITEMS } from "@/components/landing/faq-data";
import { PLANS } from "@/lib/billing";

describe("structured data", () => {
  it("describes Fina as an Organization with the square logo", () => {
    const schema = buildOrganizationSchema();
    expect(schema["@type"]).toBe("Organization");
    expect(schema.name).toBe("Fina");
    expect(schema.logo).toMatch(/\/logo\.png$/);
  });

  it("describes the WebSite", () => {
    const schema = buildWebsiteSchema();
    expect(schema["@type"]).toBe("WebSite");
    expect(schema.name).toBe("Fina");
  });

  it("describes a SoftwareApplication with free and Pro offers in USD", () => {
    const schema = buildSoftwareApplicationSchema();
    expect(schema["@type"]).toBe("SoftwareApplication");
    expect(schema.applicationCategory).toBe("EducationalApplication");
    const prices = schema.offers.map((o) => o.price);
    expect(prices).toEqual(["0", (PLANS.monthly.amountCents / 100).toFixed(2)]);
    expect(prices[1]).toBe("9.99");
    for (const offer of schema.offers) expect(offer.priceCurrency).toBe("USD");
  });

  it("builds the FAQPage from the same items the FAQ section renders", () => {
    const schema = buildFaqSchema();
    expect(schema["@type"]).toBe("FAQPage");
    expect(schema.mainEntity).toHaveLength(FAQ_ITEMS.length);
    schema.mainEntity.forEach((entry, i) => {
      expect(entry["@type"]).toBe("Question");
      expect(entry.name).toBe(FAQ_ITEMS[i].question);
      expect(entry.acceptedAnswer["@type"]).toBe("Answer");
      expect(entry.acceptedAnswer.text).toBe(FAQ_ITEMS[i].answer);
    });
  });

  it("renders JSON-LD that cannot close its own script tag", () => {
    const { container } = render(<JsonLd data={{ "@type": "Thing", name: "</script><b>x</b>" }} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    expect(script!.innerHTML).not.toContain("</script>");
    expect(JSON.parse(script!.innerHTML).name).toBe("</script><b>x</b>");
  });
});
