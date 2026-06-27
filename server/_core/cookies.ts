import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  // Share the session cookie across ALL subdomains of the production domain
  // (one. / vitacon. / apex) so a login on one. is recognized on vitacon. too.
  // On localhost, the Hostinger test host, or a raw IP, keep it host-only.
  const host = (req.hostname || "").toLowerCase();
  const domain =
    host.endsWith("cadastrodigital.com.br") && !LOCAL_HOSTS.has(host) && !isIpAddress(host)
      ? ".cadastrodigital.com.br"
      : undefined;

  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req),
    domain,
  };
}
