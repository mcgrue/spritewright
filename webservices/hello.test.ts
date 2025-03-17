import { assertEquals } from "jsr:@std/assert";
import { describe, it } from "jsr:@std/testing/bdd";

describe("hello webservice", () => {
  const baseUrl = "http://localhost:8030";

  it("should return hello world json", async () => {
    const response = await fetch(`${baseUrl}/hello`);
    assertEquals(response.status, 200);

    const data = await response.json();
    assertEquals(typeof data.message, "string");
    assertEquals(data.message, "Hello, World!");
    assertEquals(typeof data.timestamp, "string");

    // Verify timestamp is valid ISO string
    const timestamp = new Date(data.timestamp);
    assertEquals(timestamp.toString() !== "Invalid Date", true);
  });
});
