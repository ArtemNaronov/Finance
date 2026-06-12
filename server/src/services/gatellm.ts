import axios, { isAxiosError } from 'axios';
import '../config/env.js';
import {
  getGateLlmApiKey,
  getGateLlmBaseUrl,
  getGateLlmModel,
  RECOMMENDED_BASE_URL,
  RECOMMENDED_MODEL,
} from '../config/gatellm-env.js';

const SYSTEM_PROMPT = `Ты персональный финансовый аналитик.

Твои задачи:
- анализировать данные пользователя;
- выявлять закономерности;
- находить необычные траты;
- объяснять тренды;
- предлагать способы оптимизации расходов.

Правила:
- использовать только переданные данные;
- не придумывать цифры;
- не давать инвестиционных советов;
- не гарантировать финансовые результаты;
- переводы в копилки — это НЕ расходы на потребление, их нельзя рекомендовать сокращать как траты;
- платежи по кредитам — это НЕ накопление и НЕ расходы на потребление; они уменьшают свободный остаток;
- свободный остаток = доходы − расходы − копилки − кредиты;
- по кредитам давать рекомендации по ежемесячному платежу на основе переданных цифр;
- объяснять выводы простым языком;
- отвечать кратко и по существу;
- делать акцент на фактах и статистике.`;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const CONNECT_RETRIES = 3;
const CONNECT_RETRY_DELAY_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseApiErrorBody(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const err = (data as { error?: { message?: string } | string }).error;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && err.message) return err.message;
  return '';
}

function formatApiError(error: unknown, model: string): string {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const apiMessage = parseApiErrorBody(error.response?.data) || error.message;

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return (
        `Не удаётся подключиться к GateLLM. Проверьте интернет и URL: ${RECOMMENDED_BASE_URL} ` +
        `(не используйте api.gatellm.ru).`
      );
    }
    if (status === 401) {
      return 'Неверный API-ключ. Создайте новый на https://gatellm.ru/dashboard';
    }
    if (status === 402) {
      return 'Недостаточно средств на балансе GateLLM. Пополните на https://gatellm.ru/dashboard';
    }
    if (status === 400 && apiMessage.toLowerCase().includes('not available')) {
      return `Модель «${model}» недоступна. Укажите GATELLM_MODEL=${RECOMMENDED_MODEL}`;
    }
    if (status) {
      return `Ошибка GateLLM (${status}): ${apiMessage}`;
    }
    return `Ошибка GateLLM: ${apiMessage}`;
  }
  return error instanceof Error ? error.message : 'Неизвестная ошибка GateLLM';
}

async function postWithRetries(url: string, body: object, apiKey: string) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= CONNECT_RETRIES; attempt++) {
    try {
      return await axios.post(url, body, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      });
    } catch (error) {
      lastError = error;
      const retryable =
        isAxiosError(error) &&
        (!error.response ||
          error.code === 'ENOTFOUND' ||
          error.code === 'ECONNREFUSED' ||
          error.code === 'ETIMEDOUT');
      if (retryable && attempt < CONNECT_RETRIES) {
        await sleep(CONNECT_RETRY_DELAY_MS * attempt);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function callGPT(
  messages: ChatMessage[],
  options?: { maxTokens?: number; temperature?: number },
): Promise<string> {
  const apiKey = getGateLlmApiKey();
  const baseURL = getGateLlmBaseUrl();
  const model = getGateLlmModel();

  if (!apiKey) {
    throw new Error('Укажите GATELLM_API_KEY в .env (ключ с https://gatellm.ru/dashboard)');
  }

  try {
    const response = await postWithRetries(
      `${baseURL}/chat/completions`,
      {
        model,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        max_tokens: options?.maxTokens ?? 500,
        temperature: options?.temperature ?? 0.7,
      },
      apiKey,
    );

    const content = response.data.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('Пустой ответ от GateLLM');
    }
    return content;
  } catch (error) {
    const message = formatApiError(error, model);
    console.error('GateLLM API error:', message);
    throw new Error(message);
  }
}

export async function generateInsight(context: string): Promise<string> {
  return callGPT(
    [
      {
        role: 'user',
        content: `На основе данных ниже сгенерируй короткий финансовый инсайт (максимум 3 предложения).
Используй конкретные цифры из данных. Без нравоучений. Дружелюбный тон.

${context}`,
      },
    ],
    { maxTokens: 200, temperature: 0.6 },
  );
}

export async function generateRecommendations(context: string): Promise<string[]> {
  const response = await callGPT(
    [
      {
        role: 'user',
        content: `На основе финансовых данных пользователя предложи 2-3 краткие рекомендации.
Каждая рекомендация — одно предложение с конкретными цифрами.
Формат: каждая рекомендация с новой строки, без нумерации.

${context}`,
      },
    ],
    { maxTokens: 300, temperature: 0.6 },
  );

  return response
    .split('\n')
    .map((line) => line.replace(/^[-•\d.)\s]+/, '').trim())
    .filter((line) => line.length > 10)
    .slice(0, 3);
}

export async function generateMonthlyReport(context: string, monthName: string): Promise<{
  summary: string;
  recommendations: string;
}> {
  const response = await callGPT(
    [
      {
        role: 'user',
        content: `Сформируй итоговый финансовый отчёт за ${monthName}.
Структура:
1. Краткое резюме месяца (2-3 предложения с цифрами)
2. Основные категории расходов
3. Изменения относительно прошлого месяца
4. Рекомендации (2-3 предложения)

Раздели ответ маркером --- между резюме и рекомендациями.

${context}`,
      },
    ],
    { maxTokens: 600, temperature: 0.6 },
  );

  const parts = response.split('---');
  if (parts.length >= 2) {
    return { summary: parts[0].trim(), recommendations: parts.slice(1).join('---').trim() };
  }
  return { summary: response, recommendations: '' };
}

export async function chatWithAI(userMessage: string, context: string): Promise<string> {
  return callGPT(
    [
      {
        role: 'user',
        content: `Контекст финансовых данных пользователя:\n\n${context}\n\nВопрос пользователя: ${userMessage}`,
      },
    ],
    { maxTokens: 800, temperature: 0.7 },
  );
}
