import "server-only";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_VAULT_BUCKET = "vault";

export function getVaultBucketName() {
  return process.env.SUPABASE_VAULT_BUCKET?.trim() || DEFAULT_VAULT_BUCKET;
}

export async function getSignedDocumentUrl(storagePath: string) {
  const bucket = getVaultBucketName();
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    throw new Error(error?.message || "Could not create signed upload URL.");
  }

  return {
    bucket,
    storagePath,
    url: data.signedUrl,
    token: data.token,
    path: data.path,
    expiresInSeconds: 120,
  };
}

export function buildVaultStoragePath(userId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${userId}/${Date.now()}-${safeName}`;
}
