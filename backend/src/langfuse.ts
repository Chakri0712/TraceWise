import { Langfuse } from 'langfuse';

let langfuse: Langfuse | null = null;

export function getLangfuse(): Langfuse | null {
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const host = process.env.LANGFUSE_HOST;

  if (
    !publicKey ||
    !secretKey ||
    !host ||
    publicKey.includes('...') ||
    secretKey.includes('...')
  ) {
    console.warn('[Langfuse] Not configured or using placeholder credentials — skipping tracing.');
    return null;
  }

  if (!langfuse) {
    langfuse = new Langfuse({
      publicKey,
      secretKey,
      baseUrl: host,
    });
  }

  return langfuse;
}

export async function flushLangfuse(): Promise<void> {
  if (langfuse) {
    await langfuse.flushAsync();
  }
}
