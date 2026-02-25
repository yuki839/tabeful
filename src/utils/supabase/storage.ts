type SignedUrlResult = {
  signedUrl?: string;
  signedURL?: string;
};

const buildStoragePath = (path: string, bucket: string) => {
  const trimmed = path.replace(/^\/+/, "");
  const bucketPrefix = `${bucket}/`;
  return trimmed.startsWith(bucketPrefix) ? trimmed.slice(bucketPrefix.length) : trimmed;
};

const buildPublicUrl = (supabaseUrl: string, bucket: string, path: string) =>
  `${supabaseUrl}/storage/v1/object/public/${bucket}/${buildStoragePath(path, bucket)}`;

const tryPublicUrl = async (
  supabaseUrl: string,
  bucket: string,
  path: string
) => {
  try {
    const publicUrl = buildPublicUrl(supabaseUrl, bucket, path);
    const response = await fetch(publicUrl, { method: "HEAD" });
    return response.ok ? publicUrl : null;
  } catch {
    return null;
  }
};

export async function createSignedUrlSafe(
  bucket: string,
  path: string,
  expiresIn: number,
  accessToken?: string | null
): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalizedPath = buildStoragePath(path, bucket);
  const url = `${supabaseUrl}/storage/v1/object/sign/${bucket}/${normalizedPath}`;

  const apiKey = serviceRoleKey ?? supabaseKey;
  const authKey = accessToken ?? serviceRoleKey ?? supabaseKey;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${authKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn }),
    });

    if (!response.ok) {
      return await tryPublicUrl(supabaseUrl, bucket, path);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return await tryPublicUrl(supabaseUrl, bucket, path);
    }

    const data = (await response.json()) as SignedUrlResult;
    const signedUrl = data.signedUrl ?? data.signedURL ?? null;
    if (!signedUrl) {
      return await tryPublicUrl(supabaseUrl, bucket, path);
    }

    return signedUrl.startsWith("http") ? signedUrl : `${supabaseUrl}${signedUrl}`;
  } catch {
    return await tryPublicUrl(supabaseUrl, bucket, path);
  }
}
