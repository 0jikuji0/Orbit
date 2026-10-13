import { describe, expect, it } from "vitest";
import {
  canCreateProject,
  canManageWorkspaceMember,
  effectiveProjectRole,
  hasProjectRole,
  hasWorkspaceRole,
  invitableRoles,
} from "@/lib/roles";

describe("hasWorkspaceRole", () => {
  it("respecte la hiérarchie OWNER > ADMIN > MEMBER > GUEST", () => {
    expect(hasWorkspaceRole("OWNER", "ADMIN")).toBe(true);
    expect(hasWorkspaceRole("ADMIN", "ADMIN")).toBe(true);
    expect(hasWorkspaceRole("MEMBER", "ADMIN")).toBe(false);
    expect(hasWorkspaceRole("GUEST", "MEMBER")).toBe(false);
    expect(hasWorkspaceRole("GUEST", "GUEST")).toBe(true);
  });
});

describe("hasProjectRole", () => {
  it("respecte la hiérarchie ADMIN > MEMBER > VIEWER", () => {
    expect(hasProjectRole("ADMIN", "MEMBER")).toBe(true);
    expect(hasProjectRole("MEMBER", "MEMBER")).toBe(true);
    expect(hasProjectRole("VIEWER", "MEMBER")).toBe(false);
  });
});

describe("effectiveProjectRole", () => {
  it("donne ADMIN aux propriétaires et admins du workspace, même sans être membres", () => {
    expect(effectiveProjectRole("OWNER", null)).toBe("ADMIN");
    expect(effectiveProjectRole("ADMIN", "VIEWER")).toBe("ADMIN");
  });

  it("refuse l'accès à un membre qui n'a pas rejoint le projet", () => {
    expect(effectiveProjectRole("MEMBER", null)).toBeNull();
    expect(effectiveProjectRole("GUEST", null)).toBeNull();
  });

  it("utilise le rôle projet pour un membre du workspace", () => {
    expect(effectiveProjectRole("MEMBER", "ADMIN")).toBe("ADMIN");
    expect(effectiveProjectRole("MEMBER", "VIEWER")).toBe("VIEWER");
  });

  it("plafonne un invité à la lecture seule", () => {
    expect(effectiveProjectRole("GUEST", "ADMIN")).toBe("VIEWER");
    expect(effectiveProjectRole("GUEST", "MEMBER")).toBe("VIEWER");
  });
});

describe("canCreateProject", () => {
  it("autorise tous les rôles sauf invité", () => {
    expect(canCreateProject("OWNER")).toBe(true);
    expect(canCreateProject("MEMBER")).toBe(true);
    expect(canCreateProject("GUEST")).toBe(false);
  });
});

describe("canManageWorkspaceMember", () => {
  it("interdit aux membres et invités de gérer les membres", () => {
    expect(canManageWorkspaceMember("MEMBER", "GUEST", "MEMBER")).toBe(false);
    expect(canManageWorkspaceMember("GUEST", "GUEST", null)).toBe(false);
  });

  it("autorise un admin à gérer les non-propriétaires", () => {
    expect(canManageWorkspaceMember("ADMIN", "MEMBER", "ADMIN")).toBe(true);
    expect(canManageWorkspaceMember("ADMIN", "ADMIN", "GUEST")).toBe(true);
    expect(canManageWorkspaceMember("ADMIN", "MEMBER", null)).toBe(true);
  });

  it("réserve aux propriétaires la gestion des propriétaires", () => {
    expect(canManageWorkspaceMember("ADMIN", "OWNER", "MEMBER")).toBe(false);
    expect(canManageWorkspaceMember("ADMIN", "MEMBER", "OWNER")).toBe(false);
    expect(canManageWorkspaceMember("ADMIN", "OWNER", null)).toBe(false);
    expect(canManageWorkspaceMember("OWNER", "OWNER", "ADMIN")).toBe(true);
    expect(canManageWorkspaceMember("OWNER", "MEMBER", "OWNER")).toBe(true);
  });
});

describe("invitableRoles", () => {
  it("ne permet jamais d'inviter un propriétaire", () => {
    expect(invitableRoles("OWNER")).toEqual(["ADMIN", "MEMBER", "GUEST"]);
    expect(invitableRoles("ADMIN")).toEqual(["MEMBER", "GUEST"]);
    expect(invitableRoles("MEMBER")).toEqual([]);
  });
});
