export function parseSuperAdmins() {
  const env = process.env.SUPERADMIN || process.env.SUPERADMINS || "";
  return env
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
}

export function isSuperAdminEmail(email) {
  if (!email) return false;
  const list = parseSuperAdmins();
  return list.includes(String(email).toLowerCase());
}
