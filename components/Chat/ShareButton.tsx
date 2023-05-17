import { Conversation } from '@/types/chat';
import HomeContext from '@/pages/api/home/home.context';

import { IconShare } from '@tabler/icons-react';
import { FC, useContext } from 'react';

import { useTranslation } from 'next-i18next';

interface Props {
  onShareClicked: () => void;
}

export const ShareButton: FC<Props> = ({
  onShareClicked
}) => {
  const { t } = useTranslation('chat');

  const {
    state: { selectedConversation, messageIsStreaming, prompts },

    dispatch: homeDispatch,
  } = useContext(HomeContext);


  return (
    <div className="flex flex-col">
      <div className="mb-1 w-full rounded bg-transparent pr-2 text-neutral-900 dark:text-white">
    <button className="mx-auto flex w-fit items-center gap-3 rounded border border-neutral-200 bg-white py-2 px-4 text-black hover:opacity-50 dark:border-neutral-600 dark:bg-[#343541] dark:text-white"
      onClick={onShareClicked}
    >
    <IconShare size={16} />

    {selectedConversation?.is_public == true ? (
      t('Unshare')
    ) : (
      t('Share')
    )}

    </button>
    </div>
    </div>
  );
};
