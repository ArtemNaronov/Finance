/** Как в Ai-lab: api.gatellm.ru не резолвится — используем gatellm.ru */
export const RECOMMENDED_BASE_URL = 'https://gatellm.ru/v1';
export const RECOMMENDED_MODEL = 'openai/gpt-4o-mini';

export function normalizeGateLlmBaseUrl(value?: string): string {
  const raw = (value?.trim() || RECOMMENDED_BASE_URL).replace(/\/+$/, '');
  return raw.replace(/api\.gatellm\.ru/gi, 'gatellm.ru');
}

export function getGateLlmApiKey(): string | undefined {
  const key = (
    process.env.GATELLM_API_KEY ||
    process.env.OPENAI_API_KEY ||
    ''
  )
    .trim()
    .replace(/\r/g, '');
  if (!key || key === 'sk-your-api-key') return undefined;
  return key;
}

export function getGateLlmBaseUrl(): string {
  return normalizeGateLlmBaseUrl(
    process.env.GATELLM_BASE_URL || process.env.OPENAI_BASE_URL,
  );
}

export function normalizeGateLlmModel(value?: string): string {
  const model = (value?.trim() || RECOMMENDED_MODEL).replace(/\r/g, '');
  // GateLLM ожидает префикс openai/ (как в Ai-lab)
  if (model === 'gpt-4o-mini') return RECOMMENDED_MODEL;
  return model;
}

export function getGateLlmModel(): string {
  return normalizeGateLlmModel(
    process.env.GATELLM_MODEL || process.env.OPENAI_MODEL,
  );
}
