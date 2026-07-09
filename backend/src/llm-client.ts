import { getLangfuse } from './langfuse.js';

// ── Provider config ──────────────────────────────────────────────────────────
type LLMProvider = 'azure-apim' | 'openai';

interface ProviderConfig {
  provider: LLMProvider;
  baseUrl: string;
  apiKey: string;
  apiVersion: string;
  model: string;
}

function loadConfig(): ProviderConfig {
  const provider = (process.env.LLM_PROVIDER || 'azure-apim') as LLMProvider;
  const model = process.env.LLM_MODEL || 'gpt-5.2';

  if (provider === 'openai') {
    return {
      provider: 'openai',
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY || '',
      apiVersion: '',
      model,
    };
  }

  // Default: Azure APIM (hackathon)
  return {
    provider: 'azure-apim',
    baseUrl: process.env.AZURE_APIM_BASE_URL || 'https://apim-foundry-prod-ltts.azure-api.net',
    apiKey: process.env.AZURE_APIM_API_KEY || '',
    apiVersion: process.env.AZURE_APIM_API_VERSION || '2024-12-01-preview',
    model,
  };
}

// ── Azure APIM model routing ────────────────────────────────────────────────
const AZURE_APIM_MODELS: Record<string, { path: string; type: 'chat' | 'responses' | 'embeddings' }> = {
  'gpt-5-mini': { path: '/gpt5-mini/deployments/gpt-5-mini/chat/completions', type: 'chat' },
  'gpt-5.2':   { path: '/gpt52/deployments/gpt-5.2/chat/completions', type: 'chat' },
  'gpt-5.4':   { path: '/gpt54/deployments/gpt-5.4/chat/completions', type: 'chat' },
  'codex':     { path: '/codex/responses', type: 'responses' },
  'embeddings': { path: '/embeddings/deployments/text-embedding-3-large/embeddings', type: 'embeddings' },
};

function resolveEndpoint(config: ProviderConfig): { url: string; headers: Record<string, string> } {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (config.provider === 'openai') {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
    return { url: `${config.baseUrl}/chat/completions`, headers };
  }

  // Azure APIM
  headers['api-key'] = config.apiKey;

  const modelDef = AZURE_APIM_MODELS[config.model];
  if (!modelDef) {
    // Unknown model — try generic chat/completions path
    console.warn(`[LLM] Unknown model "${config.model}", falling back to chat/completions`);
    return {
      url: `${config.baseUrl}/${config.model}/chat/completions?api-version=${config.apiVersion}`,
      headers,
    };
  }

  const separator = config.baseUrl.includes('?') ? '&' : '?';
  return {
    url: `${config.baseUrl}${modelDef.path}${separator}api-version=${config.apiVersion}`,
    headers,
  };
}

// ── Public API ──────────────────────────────────────────────────────────────
export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export async function callLLM(prompt: string, options?: LLMOptions): Promise<string> {
  const config = loadConfig();
  const { url, headers } = resolveEndpoint(config);
  // gpt-5 models only support temperature=1; older models default to 0.2
  const defaultTemp = config.model.startsWith('gpt-5') ? 1 : 0.2;
  const temperature = options?.temperature ?? defaultTemp;

  // Build messages
  const messages: { role: string; content: string }[] = [];
  if (options?.systemPrompt) {
    messages.push({ role: 'system', content: options.systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const langfuse = getLangfuse();
  const trace = langfuse?.trace({ name: `LLM-${config.model}` });
  const generation = trace?.generation({
    name: 'callLLM',
    model: config.model,
    modelParameters: {
      temperature,
      maxTokens: options?.maxTokens,
      provider: config.provider
    },
    input: messages,
  });

  // Build body — Codex uses a different format
  let body: Record<string, unknown>;
  if (config.model === 'codex' && config.provider === 'azure-apim') {
    body = { model: config.model, input: prompt };
  } else {
    // gpt-5+ models use max_completion_tokens; older models use max_tokens
    const usesCompletionTokens = config.model.startsWith('gpt-5') || config.model.startsWith('gpt-4o');
    const tokenKey = usesCompletionTokens ? 'max_completion_tokens' : 'max_tokens';
    body = {
      model: config.model,
      messages,
      temperature,
      ...(options?.maxTokens ? { [tokenKey]: options.maxTokens } : {}),
    };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    generation?.end({ level: 'ERROR', statusMessage: `Error: ${res.status} ${err}` });
    throw new Error(`LLM API error ${res.status}: ${err}`);
  }

  const data = await res.json() as Record<string, unknown>;

  // Extract content — different response shapes per model type
  let content: string;
  const modelDef = AZURE_APIM_MODELS[config.model];

  if (modelDef?.type === 'responses' || config.model === 'codex') {
    // Codex responses format
    const output = data.output as { content?: { text?: string }[] } | undefined;
    content = output?.content?.[0]?.text ?? JSON.stringify(data);
  } else {
    // Standard chat completions format
    const choices = data.choices as { message: { content: string } }[] | undefined;
    content = choices?.[0]?.message?.content ?? JSON.stringify(data);
  }

  const usage = data.usage as { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;
  
  generation?.end({
    output: content,
    usage: usage ? {
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
    } : undefined,
  });

  return content;
}

export async function callEmbeddings(input: string): Promise<number[]> {
  const config = loadConfig();
  const langfuse = getLangfuse();
  const trace = langfuse?.trace({ name: `Embeddings` });
  const modelName = config.provider === 'openai' ? 'text-embedding-3-small' : 'text-embedding-3-large';
  
  const generation = trace?.generation({
    name: 'callEmbeddings',
    model: modelName,
    input: input,
  });

  if (config.provider === 'openai') {
    const res = await fetch(`${config.baseUrl}/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
      body: JSON.stringify({ model: modelName, input }),
    });
    if (!res.ok) {
      const err = await res.text();
      generation?.end({ level: 'ERROR', statusMessage: `Error: ${res.status} ${err}` });
      throw new Error(`Embeddings API error ${res.status}: ${err}`);
    }
    const data = await res.json() as { data: { embedding: number[] }[], usage?: { prompt_tokens?: number, total_tokens?: number } };
    
    generation?.end({
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined
    });
    return data.data[0].embedding;
  }

  // Azure APIM — use embeddings deployment directly
  const embeddingsModel = AZURE_APIM_MODELS['embeddings'];
  const separator = config.baseUrl.includes('?') ? '&' : '?';
  const url = `${config.baseUrl}${embeddingsModel.path}${separator}api-version=${config.apiVersion}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'api-key': config.apiKey,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ input }),
  });

  if (!res.ok) {
    const err = await res.text();
    generation?.end({ level: 'ERROR', statusMessage: `Error: ${res.status} ${err}` });
    throw new Error(`Embeddings API error ${res.status}: ${err}`);
  }

  const data = await res.json() as { data: { embedding: number[] }[], usage?: { prompt_tokens?: number, total_tokens?: number } };
  
  generation?.end({
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined
  });
  return data.data[0].embedding;
}

export function getModelInfo(): { provider: string; model: string } {
  const config = loadConfig();
  return { provider: config.provider, model: config.model };
}
