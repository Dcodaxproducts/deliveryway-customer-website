type StorefrontRequestIdentityInput = {
  domain?: string | null;
  token?: string | null;
  userId?: string | number | null;
};

const hashIdentityPart = (value: string) => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
};

export const getStorefrontDomainIdentity = (domain?: string | null) => {
  const currentDomain =
    domain ??
    (typeof window !== "undefined" ? window.location.host : "server");

  return currentDomain.trim().toLowerCase() || "unknown-domain";
};

export const getStorefrontRequestIdentity = ({
  domain,
  token,
  userId,
}: StorefrontRequestIdentityInput = {}) => {
  const authIdentity = token
    ? `session:${hashIdentityPart(token)}`
    : userId
      ? `user:${String(userId)}`
      : "anonymous";

  return `domain:${getStorefrontDomainIdentity(domain)}|auth:${authIdentity}`;
};
