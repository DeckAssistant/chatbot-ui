import { useEffect, useRef, useState } from 'react';
import { useQuery } from 'react-query';

import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';

import { useCreateReducer } from '@/hooks/useCreateReducer';

import useErrorService from '@/services/errorService';
import useApiService from '@/services/useApiService';

import {
  cleanConversationHistory,
  cleanSelectedConversation,
} from '@/utils/app/clean';
import {
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_TEMPERATURE,
  STORAGE_TYPE,
} from '@/utils/app/const';
import {
  storageCreateConversation,
  storageUpdateConversation,
  storageGetConversationById,
} from '@/utils/app/storage/conversation';
import {
  storageGetConversations,
  storageUpdateConversations,
} from '@/utils/app/storage/conversations';
import {
  storageCreateFolder,
  storageDeleteFolder,
  storageUpdateFolder,
} from '@/utils/app/storage/folder';
import { storageGetFolders } from '@/utils/app/storage/folders';
import { storageUpdateMessage } from '@/utils/app/storage/message';
import {
  storageCreateMessages,
  storageDeleteMessages,
  storageUpdateMessages,
} from '@/utils/app/storage/messages';
import {
  storageGetPrompts,
  storageUpdatePrompts,
} from '@/utils/app/storage/prompts';
import {
  getSelectedConversation,
  saveSelectedConversation,
} from '@/utils/app/storage/selectedConversation';
import { getSettings, saveSettings } from '@/utils/app/storage/settings';
import {
  storageCreateSystemPrompt,
  storageDeleteSystemPrompt,
  storageUpdateSystemPrompt,
} from '@/utils/app/storage/systemPrompt';
import { storageGetSystemPrompts } from '@/utils/app/storage/systemPrompts';

import { Conversation, Message } from '@/types/chat';
import { KeyValuePair } from '@/types/data';
import { FolderType } from '@/types/folder';
import { OpenAIModelID, OpenAIModels, fallbackModelID } from '@/types/openai';
import { PluginKey } from '@/types/plugin';
import { Prompt } from '@/types/prompt';
import { Settings } from '@/types/settings';
import { StorageType } from '@/types/storage';
import { SystemPrompt } from '@/types/systemPrompt';

import { Chat } from '@/components/Chat/Chat';
import { Chatbar } from '@/components/Chatbar/Chatbar';
import { Navbar } from '@/components/Mobile/Navbar';
import Promptbar from '@/components/Promptbar';

import HomeContext from './home.context';
import { HomeInitialState, initialState } from './home.state';

import { v4 as uuidv4 } from 'uuid';

// DECKASSISTANT EDIT
import { useRouter } from 'next/router';
import Script from 'next/script'
import Link from 'next/link';
import Image from 'next/image';
// DECKASSISTANT EDIT

interface Props {
  serverSideApiKeyIsSet: boolean;
  serverSidePluginKeysSet: boolean;
  defaultModelId: OpenAIModelID;
  storageType: StorageType;
}

// Deliberately making this *outside* the component
let loaded = false;

const Home = ({
  serverSideApiKeyIsSet,
  serverSidePluginKeysSet,
  defaultModelId,
  storageType,
}: Props) => {
  const { t } = useTranslation('chat');
  const { getModels } = useApiService();
  const { getModelsError } = useErrorService();
  const [initialRender, setInitialRender] = useState<boolean>(true);
  // DECKASSISTANT EDIT
  const router = useRouter();
  // END DECKASSISTANT EDIT

  const contextValue = useCreateReducer<HomeInitialState>({
    initialState,
  });

  const {
    state: {
      apiKey,
      lightMode,
      folders,
      conversations,
      selectedConversation,
      prompts,
      systemPrompts,
      defaultSystemPromptId,
    },
    dispatch,
  } = contextValue;

  const stopConversationRef = useRef<boolean>(false);

  // DECKASSISTANT KEYBOARD SHORTCUT
  useEffect(() => {
    const handleKeyDown = (event : any) => {
      if (event.ctrlKey && event.altKey && event.key === "n") {
        handleNewConversation();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  // END DECKASSISTANT KEYBOARD SHORTCUT

  const { data, error, refetch } = useQuery(
    ['GetModels', apiKey, serverSideApiKeyIsSet],
    ({ signal }) => {
      if (!apiKey && !serverSideApiKeyIsSet) return null;

      return getModels(
        {
          key: apiKey,
        },
        signal,
      );
    },
    { enabled: true, refetchOnMount: false },
  );

  useEffect(() => {
    if (data) dispatch({ field: 'models', value: data });
  }, [data, dispatch]);

  useEffect(() => {
    dispatch({ field: 'modelError', value: getModelsError(error) });
  }, [dispatch, error, getModelsError]);

  // FETCH MODELS ----------------------------------------------

  const handleSelectConversation = (conversation: Conversation) => {
    dispatch({
      field: 'selectedConversation',
      value: conversation,
    });

    // DECKASSISTANT EDIT
    router.push('/?c=' + conversation.id, undefined, { shallow: true });
    // END DECKASSISTANT EDIT

    saveSelectedConversation(conversation);
  };

  // FOLDER OPERATIONS  --------------------------------------------

  const handleCreateFolder = async (name: string, type: FolderType) => {
    const updatedFolders = storageCreateFolder(
      storageType,
      name,
      type,
      folders,
    );

    dispatch({ field: 'folders', value: updatedFolders });
  };

  const handleDeleteFolder = async (folderId: string) => {
    const updatedFolders = folders.filter((f) => f.id !== folderId);
    dispatch({ field: 'folders', value: updatedFolders });

    const updatedConversations: Conversation[] = conversations.map((c) => {
      if (c.folderId === folderId) {
        return {
          ...c,
          folderId: null,
        };
      }

      return c;
    });

    dispatch({ field: 'conversations', value: updatedConversations });

    const updatedPrompts: Prompt[] = prompts.map((p) => {
      if (p.folderId === folderId) {
        return {
          ...p,
          folderId: null,
        };
      }

      return p;
    });

    dispatch({ field: 'prompts', value: updatedPrompts });

    await storageUpdateConversations(storageType, updatedConversations);
    await storageUpdatePrompts(storageType, updatedPrompts);
    storageDeleteFolder(storageType, folderId, folders);
  };

  const handleUpdateFolder = async (folderId: string, name: string) => {
    const updatedFolders = storageUpdateFolder(
      storageType,
      folderId,
      name,
      folders,
    );

    dispatch({ field: 'folders', value: updatedFolders });
  };

  // CONVERSATION OPERATIONS  --------------------------------------------

  const handleNewConversation = async (folderId: string = "") => {
    const lastConversation = conversations[conversations.length - 1];

    const defaultSystemPrompt = systemPrompts.find(
      (p) => p.id === defaultSystemPromptId,
    );

    let systemPrompt = DEFAULT_SYSTEM_PROMPT;
    if (defaultSystemPrompt) {
      systemPrompt = defaultSystemPrompt.content;
    }

    const newConversation: Conversation = {
      id: uuidv4(),
      name: `${t('New Conversation')}`,
      messages: [],
      model: OpenAIModels[defaultModelId],
      prompt: systemPrompt,
      temperature: DEFAULT_TEMPERATURE,
      is_public: false,
      is_fav: false,
      folderId: (folderId ? folderId : (selectedConversation ? selectedConversation.folderId : null)),
      created_at: new Date(),
    };

    const updatedConversations = storageCreateConversation(
      storageType,
      newConversation,
      conversations,
    );

    // DECKASSISTANT EDIT
    router.push('/?c=' + newConversation.id, undefined, { shallow: true });
    // END DECKASSISTANT EDIT

    dispatch({ field: 'selectedConversation', value: newConversation });
    dispatch({ field: 'conversations', value: updatedConversations });

    saveSelectedConversation(newConversation);

    dispatch({ field: 'loading', value: false });
  };

  // DECKASSISTANT EDIT
  const handleNewConversationInFolder = (
    folderId : string
  ) => {
    handleNewConversation(folderId);
  };
  // END DECKASSISTANT EDIT

  const handleUpdateConversation = (
    conversation: Conversation,
    data: KeyValuePair,
  ) => {
    const updatedConversation = {
      ...conversation,
      [data.key]: data.value,
    };

    let update: {
      single: Conversation;
      all: Conversation[];
    };

    if (data.key === 'messages') {
      const messages = conversation.messages;
      const updatedMessageList = data.value as Message[];

      const deletedMessages = messages.filter(
        (m) => !updatedMessageList.includes(m),
      );

      const updatedMessages = messages.filter((m) =>
        updatedMessageList.includes(m),
      );

      const deletedMessageIds = deletedMessages.map((m) => m.id);

      const cleaned = storageDeleteMessages(
        storageType,
        deletedMessageIds,
        conversation,
        messages,
        conversations,
      );

      const cleanConversation = cleaned.single;
      const cleanConversations = cleaned.all;

      update = storageUpdateMessages(
        storageType,
        cleanConversation,
        updatedMessages,
        cleanConversations,
      );
    } else {
      update = storageUpdateConversation(
        storageType,
        updatedConversation,
        conversations,
      );
    }

    dispatch({ field: 'selectedConversation', value: update.single });
    dispatch({ field: 'conversations', value: update.all });
    saveSelectedConversation(update.single);
  };

  // SYSTEM PROMPT OPERATIONS  --------------------------------------------

  const handleCreateSystemPrompt = async () => {
    const newSystemPrompt: SystemPrompt = {
      id: uuidv4(),
      name: `${t('New System Prompt')}`,
      content: DEFAULT_SYSTEM_PROMPT,
    };

    const updatedSystemPrompts = storageCreateSystemPrompt(
      storageType,
      newSystemPrompt,
      systemPrompts,
    );

    dispatch({ field: 'systemPrompts', value: updatedSystemPrompts });
  };

  const handleUpdateSystemPrompt = (updatedSystemPrompt: SystemPrompt) => {
    let update: {
      single: SystemPrompt;
      all: SystemPrompt[];
    };

    update = storageUpdateSystemPrompt(
      storageType,
      updatedSystemPrompt,
      systemPrompts,
    );

    dispatch({ field: 'systemPrompts', value: update.all });
  };

  const handleDeleteSystemPrompt = (systemPromptId: string) => {
    const updatedSystemPrompts = systemPrompts.filter(
      (s) => s.id !== systemPromptId,
    );

    if (defaultSystemPromptId === systemPromptId) {
      // Resetting default system prompt to built-in
      const settings: Settings = getSettings();
      saveSettings({ ...settings, defaultSystemPromptId: '0' });
      dispatch({ field: 'defaultSystemPromptId', value: '0' });
    }
    dispatch({ field: 'systemPrompts', value: updatedSystemPrompts });

    storageDeleteSystemPrompt(storageType, systemPromptId, systemPrompts);
  };

  // EFFECTS  --------------------------------------------

  useEffect(() => {
    if (window.innerWidth < 640) {
      dispatch({ field: 'showChatbar', value: false });
    }
  }, [dispatch, selectedConversation]);

  useEffect(() => {
    defaultModelId &&
      dispatch({ field: 'defaultModelId', value: defaultModelId });
    storageType && dispatch({ field: 'storageType', value: storageType });
    serverSideApiKeyIsSet &&
      dispatch({
        field: 'serverSideApiKeyIsSet',
        value: serverSideApiKeyIsSet,
      });
    serverSidePluginKeysSet &&
      dispatch({
        field: 'serverSidePluginKeysSet',
        value: serverSidePluginKeysSet,
      });
  }, [
    defaultModelId,
    storageType,
    serverSideApiKeyIsSet,
    serverSidePluginKeysSet,
    dispatch,
  ]);

  // ON LOAD --------------------------------------------

  useEffect(() => {
    if(loaded) {
      return;
    }
    loaded = true;

    const settings = getSettings();
    if (settings.theme) {
      dispatch({
        field: 'lightMode',
        value: settings.theme,
      });
    }
    if (settings.defaultSystemPromptId) {
      dispatch({
        field: 'defaultSystemPromptId',
        value: settings.defaultSystemPromptId,
      });
    }

    console.log('onload');

    if (window.innerWidth < 640) {
      dispatch({ field: 'showChatbar', value: false });
      dispatch({ field: 'showPromptbar', value: false });
    }

    const showChatbar = localStorage.getItem('showChatbar');
    if (showChatbar) {
      dispatch({ field: 'showChatbar', value: showChatbar === 'true' });
    }

    const showPromptbar = localStorage.getItem('showPromptbar');
    if (showPromptbar) {
      dispatch({ field: 'showPromptbar', value: showPromptbar === 'true' });
    }

    storageGetFolders(storageType).then((folders) => {
      if (folders) {
        dispatch({ field: 'folders', value: folders });
      }
    });

    storageGetPrompts(storageType).then((prompts) => {
      if (prompts) {
        dispatch({ field: 'prompts', value: prompts });
      }
    });

    storageGetSystemPrompts(storageType).then((systemPrompts) => {
      if (systemPrompts) {
        dispatch({ field: 'systemPrompts', value: systemPrompts });
      }
    });

    storageGetConversations(storageType).then((conversationHistory) => {
      if (conversationHistory) {
        const parsedConversationHistory: Conversation[] = conversationHistory;
        const cleanedConversationHistory = cleanConversationHistory(
          parsedConversationHistory,
        );

        dispatch({ field: 'conversations', value: cleanedConversationHistory });
      }
    });

    // DECKASSISTANT EDIT
    const urlSearchParams = new URLSearchParams(window.location.search);
    const conversationIdParam = urlSearchParams.get('c');
    var selectedConversation;
    if(conversationIdParam && !selectedConversation) {
      selectedConversation = storageGetConversationById(storageType, conversationIdParam).then((selectedConversation) => {
        try {
          const parsedSelectedConversation: Conversation = JSON.parse(selectedConversation);
          const cleanedSelectedConversation = cleanSelectedConversation(
            parsedSelectedConversation,
          );

          dispatch({
            field: 'selectedConversation',
            value: cleanedSelectedConversation,
          });
        }
        catch(e) {

        }
      });
    }
    if(!selectedConversation) {
      // this gets the last conversation
      //selectedConversation = getSelectedConversation();

    }
    if (selectedConversation) {
      try {
        const parsedSelectedConversation: Conversation =
          JSON.parse(String(selectedConversation));
        const cleanedSelectedConversation = cleanSelectedConversation(
          parsedSelectedConversation,
        );

        dispatch({
          field: 'selectedConversation',
          value: cleanedSelectedConversation,
        });
      }
      catch(e) {

      }
      // END DECKASSISTANT EDIT
    } else {
      const defaultSystemPrompt = systemPrompts.find(
        (p) => p.id === defaultSystemPromptId,
      );

      let systemPrompt = DEFAULT_SYSTEM_PROMPT;
      if (defaultSystemPrompt) {
        systemPrompt = defaultSystemPrompt.content;
      }

      const newConversation: Conversation = {
        id: uuidv4(),
        name: `${t('New Conversation')}`,
        messages: [],
        model: OpenAIModels[defaultModelId],
        prompt: systemPrompt,
        temperature: DEFAULT_TEMPERATURE,
        is_public: false,
        is_fav: false,
        folderId: null,
        created_at: new Date(),
      };

      dispatch({
        field: 'selectedConversation',
        value: newConversation,
      });
    }
  }, [
    defaultModelId,
    storageType,
    dispatch,
    serverSideApiKeyIsSet,
    serverSidePluginKeysSet,
  ]);

  return (
    <HomeContext.Provider
      value={{
        ...contextValue,
        handleNewConversation,
        handleCreateFolder,
        handleDeleteFolder,
        handleUpdateFolder,
        handleSelectConversation,
        handleUpdateConversation,
        handleCreateSystemPrompt,
        handleUpdateSystemPrompt,
        handleDeleteSystemPrompt,
        handleNewConversationInFolder,
      }}
    >
      <Head>
      <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="DeckAssistant - Chatbot UI"></meta>
        <title>DeckAssistant - Chatbot UI</title>
        <meta name="title" content="DeckAssistant - AI Assistant for Stream Deck"/>
        <meta name="description" content="Stream Deck plugin that puts A.I. at your fingertips. Literally."/>
        <meta property="og:type" content="website"/>
        <meta property="og:title" content="DeckAssistant - AI Assistant for Stream Deck"/>
        <meta property="og:description" content="Stream Deck plugin that puts A.I. at your fingertips. Literally."/>
        <meta property="og:image" content="https://deckassistant.io/images/poster.png"/>
        <meta property="twitter:card" content="summary_large_image"/>
        <meta property="twitter:title" content="DeckAssistant - AI Assistant for Stream Deck"/>
        <meta property="twitter:description" content="Stream Deck plugin that puts A.I. at your fingertips. Literally."/>
        <meta property="twitter:image" content="https://deckassistant.io/images/poster.png"/>
        <meta
          name="viewport"
          content="height=device-height ,width=device-width, initial-scale=1, user-scalable=no"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Script defer data-domain="chat.deckassistant.io" src="https://stats.lostdomain.org/js/script.tagged-events.outbound-links.js" />
      {selectedConversation && (
        <div className="min-h-screen flex flex-col">
          <header>
            <nav className="bg-[#202123]">
                <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16">
                        <div className="flex">
                            <div className="flex flex-shrink-0 items-center justify-start">
                              <Link href="https://deckassistant.io/">
                                <img className="block h-14 w-auto lg:hidden" src="https://deckassistant.io/images/deckassistant-logo.png"
                                    alt="DeckAssistant" /></Link>
                                <Link href="https://deckassistant.io/">
                                  <img className="hidden h-14 w-auto lg:block" src="https://deckassistant.io/images/deckassistant-logo.png"
                                    alt="DeckAssistant" /></Link>
                                <div className="hidden lg:block text-white ml-4 text-xl">
                                  <Link href="https://deckassistant.io/">DeckAssistant</Link>
                                </div>
                            </div>

                        </div>
                        <div className="-mr-2 flex justify-items-end grow">
                            <div className="flex flex-grow grid justify-items-end">
                                <div className="relative inline-block text-left mt-3 text-white align-middle">
                                  <Link className="align-middle inline-block rounded-md bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50" href="https://deckassistant.io/dashboard">
                                    Manage Your Account
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
          </header>

        <main
          className={`flex h-[calc(100vh-64px)] w-screen flex-col text-sm text-white dark:text-white ${lightMode}`}
        >
          <div className="fixed top-0 w-full sm:hidden">
            <Navbar
              selectedConversation={selectedConversation}
              onNewConversation={handleNewConversation}
            />
          </div>

          <div className="flex h-full w-full pt-[48px] sm:pt-0">
            <Chatbar />

            <div className="flex flex-1">
              <Chat stopConversationRef={stopConversationRef} />
            </div>

            <Promptbar />
          </div>
        </main>
        </div>
      )}
    </HomeContext.Provider>
  );
};
export default Home;

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const defaultModelId =
    (process.env.DEFAULT_MODEL &&
      Object.values(OpenAIModelID).includes(
        process.env.DEFAULT_MODEL as OpenAIModelID,
      ) &&
      process.env.DEFAULT_MODEL) ||
    fallbackModelID;

  const storageType = STORAGE_TYPE;

  let serverSidePluginKeysSet = false;

  const googleApiKey = process.env.GOOGLE_API_KEY;
  const googleCSEId = process.env.GOOGLE_CSE_ID;

  if (googleApiKey && googleCSEId) {
    serverSidePluginKeysSet = true;
  }

  return {
    props: {
      serverSideApiKeyIsSet: !!process.env.OPENAI_API_KEY,
      defaultModelId,
      storageType,
      serverSidePluginKeysSet,
      ...(await serverSideTranslations(locale ?? 'en', [
        'common',
        'chat',
        'sidebar',
        'markdown',
        'promptbar',
      ])),
    },
  };
};
