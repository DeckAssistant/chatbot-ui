import { storageUpdateConversation } from '@/utils/app/storage/conversation';

import { Conversation } from '@/types/chat';
import { StorageType } from '@/types/storage';
import toast from 'react-hot-toast';

export const shareChatHandler = async (
  conversation: Conversation,
  storageType: StorageType,
  is_public: boolean,
  homeDispatch: React.Dispatch<any>,
) => {
  conversation.is_public = is_public;
  storageUpdateConversation(storageType, conversation, []);

  if(is_public) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText("https://deckassistant.io/shared-chat/" + conversation.id);
    }
    toast.success('Shared conversation and copied link to clipboard!');
  }
  else {
    toast.success('Successfully unshared chat');
  }

  homeDispatch({
    field: 'selectedConversation',
    value: conversation,
  });
};
