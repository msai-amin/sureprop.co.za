export async function getSignedDocumentUrl(storagePath: string) {
  return {
    storagePath,
    url: "stub-signed-url",
    expiresInSeconds: 300,
  };
}

export function buildVaultStoragePath(userId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `vault/${userId}/${Date.now()}-${safeName}`;
}
