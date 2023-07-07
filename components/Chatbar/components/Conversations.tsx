import { Conversation } from '@/types/chat';

import { ConversationComponent } from './Conversation';

interface Props {
  conversations: Conversation[];
}

export const Conversations = ({ conversations }: Props) => {
  const sortedConversations = [...conversations]; // Create a copy of the conversations array

  sortedConversations.sort((a, b) => {
    // First, sort by is_fav (true values will be on top)
    if (a.is_fav && !b.is_fav) return -1;
    if (!a.is_fav && b.is_fav) return 1;

    // If is_fav is the same for both conversations, sort by created_at
    return (new Date(b.created_at)).getTime() - (new Date(a.created_at)).getTime()
  });

  return (
    <div className="flex w-full flex-col gap-1">
      {sortedConversations
        .filter((conversation) => !conversation.folderId)
        .map((conversation, index) => (
          <ConversationComponent key={index} conversation={conversation} />
        ))}
    </div>
  );
};
