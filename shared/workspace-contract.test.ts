import { describe, expect, it } from "vitest";
import { assignWorkspaceFunnelsSchema, createWorkspaceSchema, inviteWorkspaceMemberSchema } from "./workspace-contract";

describe("workspace mutation contracts", () => {
  it("rejects owner/role injection and normalizes the invited email", () => {
    expect(inviteWorkspaceMemberSchema.parse({ email: "  Customer@Example.com  " })).toEqual({ email: "customer@example.com" });
    expect(inviteWorkspaceMemberSchema.safeParse({ email: "customer@example.com", role: "owner" }).success).toBe(false);
    expect(createWorkspaceSchema.safeParse({ name: "Client", ownerId: 42 }).success).toBe(false);
  });

  it("rejects duplicate, fractional and nonpositive resource IDs", () => {
    for (const funnelIds of [[1, 1], [1.5], [0], [-1], ["1"]]) {
      expect(assignWorkspaceFunnelsSchema.safeParse({ funnelIds }).success).toBe(false);
    }
    expect(assignWorkspaceFunnelsSchema.parse({ funnelIds: [] })).toEqual({ funnelIds: [] });
  });

  it("does not accept empty workspace names or unbounded values", () => {
    expect(createWorkspaceSchema.safeParse({ name: "   " }).success).toBe(false);
    expect(createWorkspaceSchema.safeParse({ name: "x".repeat(101) }).success).toBe(false);
    expect(createWorkspaceSchema.parse({ name: "  Kundenbereich  " }).name).toBe("Kundenbereich");
  });
});
