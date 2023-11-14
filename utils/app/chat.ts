import { ChatBody, Conversation } from '@/types/chat';
import { Plugin, PluginID, PluginKey } from '@/types/plugin';

import { getEndpoint } from './api';

export const sendChatRequest = async (
  conversation: Conversation,
  plugin: Plugin | null,
  apiKey: string,
  pluginKeys: PluginKey[],
) => {
  const chatBody: ChatBody = {
    model: conversation.model,
    messages: conversation.messages,
    key: apiKey,
    prompt: conversation.prompt,
    temperature: conversation.temperature,
    plugin: plugin?.id || 'chatgpt',
  };
  const endpoint = getEndpoint(plugin);
  let body = JSON.stringify(chatBody);
  if (plugin) {
    if(plugin.id == PluginID.GOOGLE_SEARCH) {
      body = JSON.stringify({
        ...chatBody,
        googleAPIKey: pluginKeys
          .find((key) => key.pluginId === 'google-search')
          ?.requiredKeys.find((key) => key.key === 'GOOGLE_API_KEY')?.value,
        googleCSEId: pluginKeys
          .find((key) => key.pluginId === 'google-search')
          ?.requiredKeys.find((key) => key.key === 'GOOGLE_CSE_ID')?.value,
      });
    }
  }
  const controller = new AbortController();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    signal: controller.signal,
    body,
  });

  return { response: response, controller: controller };
};
