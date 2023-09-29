import { test, expect } from "@jest/globals";
import { Status } from "../src/utils";

test("Status", async () => {
    expect(Status.COMPLETED).toBe("COMPLETED");
    expect(Status.PARTIAL).toBe("PARTIAL");
    expect(Status.FAILED).toBe("FAILED");
});
