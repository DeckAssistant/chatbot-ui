import { MutableRefObject, useContext } from 'react';
import toast from 'react-hot-toast';

import { storageUpdateConversation } from '@/utils/app/storage/conversation';
import { storageCreateMessage } from '@/utils/app/storage/message';
import { saveSelectedConversation } from '@/utils/app/storage/selectedConversation';

import { Conversation, Message } from '@/types/chat';
import { Plugin, PluginKey } from '@/types/plugin';
import { StorageType } from '@/types/storage';

import { sendChatRequest } from '../chat';

import { v4 as uuidv4 } from 'uuid';

export const sendHandlerFunction = async (
  message: Message,
  plugin: Plugin | null = null,
  stopConversationRef: MutableRefObject<boolean>,
  selectedConversation: Conversation | undefined,
  conversations: Conversation[],
  storageType: StorageType,
  apiKey: string,
  pluginKeys: PluginKey[],
  homeDispatch: React.Dispatch<any>,
) => {
  if (selectedConversation) {
    homeDispatch({ field: 'loading', value: true });
    homeDispatch({ field: 'messageIsStreaming', value: true });

    // new conversation, create it first
    let firstMessage = false;
    if(selectedConversation.messages.length === 0) {
      firstMessage = true;
    }

    let updatedConversation: Conversation;

    updatedConversation = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, message],
    };

    homeDispatch({
      field: 'selectedConversation',
      value: updatedConversation,
    });

    // Saving the user message
    storageCreateMessage(
      storageType,
      selectedConversation,
      message,
      conversations,
    );

    const { response, controller } = await sendChatRequest(
      updatedConversation,
      plugin,
      apiKey,
      pluginKeys,
    );

    if (!response.ok) {
      homeDispatch({ field: 'loading', value: false });
      homeDispatch({ field: 'messageIsStreaming', value: false });
      toast.error(response.statusText);
      return;
    }
    const data = response.body;
    if (!data) {
      homeDispatch({ field: 'loading', value: false });
      homeDispatch({ field: 'messageIsStreaming', value: false });
      return;
    }

    const assistantMessageId = uuidv4();
    const responseMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
    };
    if (!plugin) {
      homeDispatch({ field: 'loading', value: false });
      const reader = data.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let text = '';

      updatedConversation.messages.push(responseMessage);
      const length = updatedConversation.messages.length;
      while (!done) {
        if (stopConversationRef.current === true) {
          controller.abort();
          done = true;
          break;
        }
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        text += chunkValue;

        updatedConversation.messages[length - 1].content = text;

        homeDispatch({
          field: 'selectedConversation',
          value: updatedConversation,
        });
      }

      updatedConversation.messages.pop();
    } else {
      const { answer } = await response.json();
      responseMessage.content = answer;
    }

    homeDispatch({ field: 'loading', value: false });
    homeDispatch({ field: 'messageIsStreaming', value: false });

    // Saving the response message
    const { single, all } = storageCreateMessage(
      storageType,
      updatedConversation,
      responseMessage,
      conversations,
    );

    homeDispatch({
      field: 'selectedConversation',
      value: single,
    });

    homeDispatch({ field: 'conversations', value: all });
    saveSelectedConversation(single);

    // get a recommended title for the conversation
    if(firstMessage === true) {
      console.log('Getting recommended subject..');
      const messageSubject: Message = {
        id: uuidv4(),
        role: 'user',
        content: 'What would be a short and relevant title for this chat? You must strictly answer with only the title, no other text is allowed.'
      };

      var tmpConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, messageSubject],
      };
      const { response: response_subject, controller: controller_subject } = await sendChatRequest(
        tmpConversation,
        plugin,
        apiKey,
        pluginKeys,
      );

      if (response_subject.ok && response_subject.body) {
        const reader_s = response_subject.body.getReader();
        const decoder_s = new TextDecoder();
        let done = false;
        let answer_subject = '';

        while (!done) {
          if (stopConversationRef.current === true) {
            controller.abort();
            done = true;
            break;
          }
          const { value, done: doneReading } = await reader_s.read();
          done = doneReading;
          const chunkValue = decoder_s.decode(value);
          answer_subject += chunkValue;
        }

        single.name = answer_subject;

        // Saving the conversation name
        storageUpdateConversation(
          storageType,
          { ...single, name: answer_subject },
          conversations,
        );

        homeDispatch({
          field: 'selectedConversation',
          value: single,
        });
        console.log('Changed chat subject to: ' + answer_subject);
      }
      else {
        console.log('Unable to fetch a recommended subject!');
      }
    } // end subject recommendation

  }
};
