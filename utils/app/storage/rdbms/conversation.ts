import { Conversation } from '@/types/chat';

export const rdbmsCreateConversation = async (
  newConversation: Conversation,
) => {
  await fetch('api/rdbms/conversation', {
    method: 'POST',
    body: JSON.stringify(newConversation),
  });
};

export const rdbmsUpdateConversation = async (
  updatedConversation: Conversation,
) => {
  await fetch('api/rdbms/conversation', {
    method: 'PUT',
    body: JSON.stringify(updatedConversation),
  });
};

export const rdbmsDeleteConversation = async (conversationId: string) => {
  await fetch('api/rdbms/conversation', {
    method: 'DELETE',
    body: JSON.stringify({ conversation_id: conversationId }),
  });
};

// DECKASSISTANT EDIT
export const rdbmsGetConversation = async (conversationId: string) => {
  const response = await fetch('api/rdbms/conversation?conversation_id=' + conversationId, {
    method: 'GET',
  });
  const text = await response.text();
  return text;
};
// END DECKASSISTANT EDIT