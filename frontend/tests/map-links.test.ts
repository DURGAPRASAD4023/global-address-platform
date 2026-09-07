import { describe, expect, it } from "vitest";
import { buildMapLinks, coordinatesText } from "@/lib/map-links";

describe("map links", () => {
  it("builds provider links", () => {
    const links = buildMapLinks(51.5074, -0.1278, "London");
    expect(links.openstreetmap).toContain("51.5074");
    expect(links.google_maps).toContain("51.5074");
    expect(links.apple_maps).toContain("maps.apple.com");
  });

  it("formats coordinates", () => {
    expect(coordinatesText(1.23, 4.56)).toBe("1.23, 4.56");
  });
});
