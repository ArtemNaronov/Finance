import { create } from 'zustand';
import { aiApi } from '@/api';
import type { ChatMessage } from '@/types';

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

const SUGGESTED_QUESTIONS = [
  'На что я трачу больше всего денег?',
  'Где расходы выросли?',
  'На чём можно сэкономить?',
  'Какой платёж рекомендуется по моим кредитам?',
  'Сколько осталось накопить до цели?',
  'Что изменилось по сравнению с прошлым месяцем?',
];

export { SUGGESTED_QUESTIONS };

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  loading: false,

  sendMessage: async (content) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    set((s) => ({ messages: [...s.messages, userMessage], loading: true }));

    try {
      const { reply } = await aiApi.chat(content);
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      };
      set((s) => ({ messages: [...s.messages, assistantMessage] }));
    } catch (e) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: e instanceof Error ? e.message : 'Произошла ошибка',
        timestamp: new Date().toISOString(),
      };
      set((s) => ({ messages: [...s.messages, errorMessage] }));
    } finally {
      set({ loading: false });
    }
  },

  clearMessages: () => set({ messages: [] }),
}));
