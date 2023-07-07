import { IconClearAll, IconSettings, IconScreenshot } from '@tabler/icons-react';
import {
  MutableRefObject,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useTranslation } from 'next-i18next';

import { editMessageHandler } from '@/utils/app/handlers/EditMessage';
import { regenerateMessageHandler } from '@/utils/app/handlers/RegenerateMessage';
import { sendHandlerFunction } from '@/utils/app/handlers/SendMessage';
import { shareChatHandler } from '@/utils/app/handlers/ShareChat';
import { throttle } from '@/utils/data/throttle';

import { Message } from '@/types/chat';

import HomeContext from '@/pages/api/home/home.context';

import Spinner from '../Spinner';
import { ChatInput } from './ChatInput';
import { ChatLoader } from './ChatLoader';
import { ErrorMessageDiv } from './ErrorMessageDiv';
import { MemoizedChatMessage } from './MemoizedChatMessage';
import { ModelSelect } from './ModelSelect';
import { SystemPromptSection } from './SystemPromptSection';
import { TemperatureSlider } from './Temperature';
import { PromptLibraryButton } from './PromptLibraryButton';

import { toPng } from 'html-to-image';

interface Props {
  stopConversationRef: MutableRefObject<boolean>;
}

export const Chat = memo(({ stopConversationRef }: Props) => {
  const { t } = useTranslation('chat');

  const {
    state: {
      selectedConversation,
      conversations,
      models,
      storageType,
      apiKey,
      pluginKeys,
      serverSideApiKeyIsSet,
      modelError,
      loading,
      systemPrompts,
    },
    handleUpdateConversation,
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const [currentMessage, setCurrentMessage] = useState<Message>();
  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showScrollDownButton, setShowScrollDownButton] =
    useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [libraryPromptText, setLibraryPromptText] = useState('');

  const handleSend = useCallback(sendHandlerFunction, [
    apiKey,
    conversations,
    homeDispatch,
    pluginKeys,
    selectedConversation,
    stopConversationRef,
    storageType,
  ]);

  const handleEdit = useCallback(editMessageHandler, [
    apiKey,
    conversations,
    homeDispatch,
    pluginKeys,
    selectedConversation,
    stopConversationRef,
    storageType,
  ]);

  const handleShareChat = useCallback(shareChatHandler, [
    selectedConversation,
    storageType,
    !selectedConversation?.is_public,
    homeDispatch,
  ]);

  const handleRegenerate = useCallback(regenerateMessageHandler, [
    apiKey,
    conversations,
    homeDispatch,
    pluginKeys,
    selectedConversation,
    stopConversationRef,
    storageType,
  ]);

  const scrollToBottom = useCallback(() => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      textareaRef.current?.focus();
    }
  }, [autoScrollEnabled]);

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      const bottomTolerance = 30;

      if (scrollTop + clientHeight < scrollHeight - bottomTolerance) {
        setAutoScrollEnabled(false);
        setShowScrollDownButton(true);
      } else {
        setAutoScrollEnabled(true);
        setShowScrollDownButton(false);
      }
    }
  };

  const handleScrollDown = () => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  const handleSettings = () => {
    setShowSettings(!showSettings);
  };

  const onClearAll = () => {
    if (
      confirm(t<string>('Are you sure you want to clear all messages?')) &&
      selectedConversation
    ) {
      handleUpdateConversation(selectedConversation, {
        key: 'messages',
        value: [],
      });
    }
  };

  const scrollDown = () => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView(true);
    }
  };
  const throttledScrollDown = throttle(scrollDown, 250);


  const handleScreenshot = () => {
    if (chatContainerRef.current === null) {
      return;
    }

    chatContainerRef.current.classList.remove('max-h-full');
    toPng(chatContainerRef.current, { cacheBust: true })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${selectedConversation?.name || 'conversation'}.png`;
        link.href = dataUrl;
        link.click();
        if (chatContainerRef.current) {
          chatContainerRef.current.classList.add('max-h-full');
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // useEffect(() => {
  //   console.log('currentMessage', currentMessage);
  //   if (currentMessage) {
  //     handleSend(currentMessage)hi

  useEffect(() => {
    throttledScrollDown();
    selectedConversation &&
      setCurrentMessage(
        selectedConversation.messages[selectedConversation.messages.length - 2],
      );
  }, [selectedConversation, throttledScrollDown]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAutoScrollEnabled(entry.isIntersecting);
        if (entry.isIntersecting) {
          textareaRef.current?.focus();
        }
      },
      {
        root: null,
        threshold: 0.5,
      },
    );
    const messagesEndElement = messagesEndRef.current;
    if (messagesEndElement) {
      observer.observe(messagesEndElement);
    }
    return () => {
      if (messagesEndElement) {
        observer.unobserve(messagesEndElement);
      }
    };
  }, [messagesEndRef]);


  const handleUsePromptFromLibrary = (message: string) => {
    setLibraryPromptText(message);
  };

  return (
    <div className="relative flex-1 overflow-hidden bg-white dark:bg-[#343541]">
      {modelError ? (
        <ErrorMessageDiv error={modelError} />
      ) : (
        <>
          <div
            className="max-h-full overflow-x-hidden"
            ref={chatContainerRef}
            onScroll={handleScroll}
          >
            {selectedConversation?.messages.length === 0 ? (
              <>
                <div className="mx-auto flex flex-col space-y-5 md:space-y-10 px-3 pt-5 md:pt-12 sm:max-w-[700px]">
                  <div className="text-center text-3xl font-semibold text-gray-800 dark:text-gray-100">
                    {models.length === 0 ? (
                      <div>
                        <Spinner size="16px" className="mx-auto" />
                      </div>
                    ) : (
                      <>
                      <div className="mb-4">
                        <span className="inline-block">Deck</span><span className="inline-block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Assistant</span>
                      </div>

                      <div className="text-center text-base text-black dark:text-white ">
                        <p className="mb-2">
                          Welcome to the DeckAssistant Chatbot. This is an enhanced ChatGPT interface.
                        </p>
                        <p className="mb-8">
                          Start your conversation below, or pick a starting prompt from the prompt library.
                        </p>
                      </div>

                      <div className="flex mb-4 items-center justify-center">
                        <PromptLibraryButton onUsePromptFromLibrary={handleUsePromptFromLibrary} />
                      </div>

                      </>
                    )}
                  </div>

                  {/*DECKASSISTANT EDIT
                  {models.length > 0 && (
                     <div className="flex h-full flex-col space-y-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-600">
                      <ModelSelect />

                      <SystemPromptSection systemPrompts={systemPrompts} />

                      <TemperatureSlider
                        label={t('Temperature')}
                        onChangeTemperature={(temperature) =>
                          handleUpdateConversation(selectedConversation, {
                            key: 'temperature',
                            value: temperature,
                          })
                        }
                      />
                    </div>
                  )}*/}
                </div>
              </>
            ) : (
              <>
                {/* DECKASSISTANT EDIT
                <div className="sticky top-0 z-10 flex justify-center border border-b-neutral-300 bg-neutral-100 py-2 text-sm text-neutral-500 dark:border-none dark:bg-[#444654] dark:text-neutral-200">
                  {t('Model')}: {selectedConversation?.model.name} | {t('Temp')}
                  : {selectedConversation?.temperature} |
                  <button
                    className="ml-2 cursor-pointer hover:opacity-50"
                    onClick={handleSettings}
                  >
                    <IconSettings size={18} />
                  </button>
                  <button
                    className="ml-2 cursor-pointer hover:opacity-50"
                    onClick={onClearAll}
                  >
                    <IconClearAll size={18} />
                  </button>
                </div>
                {showSettings && (
                  <div className="flex flex-col space-y-10 md:mx-auto md:max-w-xl md:gap-6 md:py-3 md:pt-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
                    <div className="flex h-full flex-col space-y-4 border-b border-neutral-200 p-4 dark:border-neutral-600 md:rounded-lg md:border">
                      <ModelSelect />
                    </div>
                  </div>
                )}*/}

                {selectedConversation?.messages.map((message, index) => (
                  <MemoizedChatMessage
                    key={index}
                    message={message}
                    messageIndex={index}
                    onEdit={(conversation, editedMessage) => {
                      setCurrentMessage(editedMessage);
                      // discard edited message and the ones that come after then resend
                      handleEdit(
                        editedMessage,
                        index,
                        null,
                        stopConversationRef,
                        conversation,
                        conversations,
                        storageType,
                        apiKey,
                        pluginKeys,
                        homeDispatch,
                      );
                    }}
                  />
                ))}

                {loading && <ChatLoader />}

                <div
                  className="h-[162px] bg-white dark:bg-[#343541]"
                  ref={messagesEndRef}
                />
              </>
            )}
          </div>

          <ChatInput
            stopConversationRef={stopConversationRef}
            textareaRef={textareaRef}
            onSend={(conversation, message, plugin) => {
              setCurrentMessage(message);
              handleSend(
                message,
                plugin,
                stopConversationRef,
                conversation,
                conversations,
                storageType,
                apiKey,
                pluginKeys,
                homeDispatch,
              );
            }}
            onScrollDownClick={handleScrollDown}
            onShareChat={(conversation) => {
                if(conversation) {
                  handleShareChat(conversation, storageType, !conversation?.is_public, homeDispatch);
                }
              }
            }
            onScreenshot={handleScreenshot}
            onRegenerate={(conversation) => {
              if (currentMessage) {
                handleRegenerate(
                  currentMessage,
                  null,
                  stopConversationRef,
                  conversation,
                  conversations,
                  storageType,
                  apiKey,
                  pluginKeys,
                  homeDispatch,
                );
              }
            }}
            showScrollDownButton={showScrollDownButton}
            libraryPromptText={libraryPromptText}
          />
        </>
      )}
    </div>
  );
});
Chat.displayName = 'Chat';
