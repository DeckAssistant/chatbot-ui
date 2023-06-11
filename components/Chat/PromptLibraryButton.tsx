import { Conversation } from '@/types/chat';
import { PromptLibraryModal } from '@/components/Chat/PromptLibraryModal';
import HomeContext from '@/pages/api/home/home.context';

import { IconBook } from '@tabler/icons-react';
import { FC, useContext, useState } from 'react';

interface Props {
  onUsePromptFromLibrary: (message: string) => void;
}

export const PromptLibraryButton: FC<Props> = ({
  onUsePromptFromLibrary
}) => {
  const {
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const [isPromptLibraryModalOpen, setIsPromptLibraryModal] = useState<boolean>(false);


  return (
    <div>
    <button className="flex w-fit items-center gap-3 py-2 px-4 text-lg inline-block rounded-md bg-gradient-to-r from-cyan-400 to-blue-600 text-center font-medium text-white shadow hover:from-cyan-500 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900"
      onClick={() => setIsPromptLibraryModal(true)}
    >
    <IconBook size={24} />
      Prompt Library
    </button>


    <PromptLibraryModal
        open={isPromptLibraryModalOpen}
        onUseButtonClick={(prompt) => {onUsePromptFromLibrary(prompt)}}
        onClose={() => {
          setIsPromptLibraryModal(false)
        }}
      />
      </div>
  );
};
