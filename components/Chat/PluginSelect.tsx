import { IconBrandGoogle, IconBrush, IconRobot } from '@tabler/icons-react';
import { FC, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'next-i18next';

import { Plugin, PluginID, PluginList } from '@/types/plugin';

interface Props {
  plugin: Plugin | null;
  onPluginChange: (plugin: Plugin) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLSelectElement>) => void;
}

export const PluginSelect: FC<Props> = ({ plugin, onPluginChange }) => {
  useEffect(() => {
    if (plugin) {
      setActiveButton(plugin.id);
    } else {
      setActiveButton('chatgpt');
    }
  }, [plugin]);

  const [activeButton, setActiveButton] = useState('');

  const handleButtonClick = (id: any) => {
    setActiveButton(id);
    onPluginChange(PluginList.find((plugin) => plugin.id === id) as Plugin);
  };

  return (
    <div>
      <div className="inline-flex rounded-md shadow-sm" role="group">
        <div className="group relative flex justify-center">
          <button
            type="button"
            className={`inline-flex items-center px-4 py-2 text-sm font-medium flex w-fit gap-3 rounded-l border border-neutral-600 text-black hover:opacity-50 text-white ${
              activeButton === 'chatgpt' ? 'bg-neutral-500' : 'bg-[#343541]'
            }`}
            id="chatgpt"
            onClick={() => handleButtonClick('chatgpt')}
          >
            <IconRobot size={24} />
          </button>
          <span className="absolute bottom-14 scale-0 transition-all rounded bg-gray-800 p-4 text-center text-xs text-white group-hover:scale-100 w-36">
            Talk to ChatGPT 🤖
          </span>
        </div>

        <div className="group relative flex justify-center">
          <button
            type="button"
            className={`inline-flex items-center px-4 py-2 text-sm font-medium flex w-fit gap-3 rounded-l border border-neutral-600 text-black hover:opacity-50 text-white ${
              activeButton === PluginID.GOOGLE_SEARCH
                ? 'bg-neutral-500'
                : 'bg-[#343541]'
            }`}
            id="${PluginID.GOOGLE_SEARCH}"
            onClick={() => handleButtonClick(PluginID.GOOGLE_SEARCH)}
          >
            <IconBrandGoogle size={24} />
          </button>
          <span className="absolute bottom-14 scale-0 transition-all rounded bg-gray-800 p-4 text-center text-xs text-white group-hover:scale-100 w-40">
            Google something 🔎
          </span>
        </div>
        {/*<div className="group relative flex justify-center">
          <button
            type="button"
            className={`inline-flex items-center px-4 py-2 text-sm font-medium flex w-fit gap-3 rounded-l border border-neutral-600 text-black hover:opacity-50 text-white ${
              activeButton === PluginID.DALLE3
                ? 'bg-neutral-500'
                : 'bg-[#343541]'
            }`}
            id="${PluginID.DALLE3}"
            onClick={() => handleButtonClick(PluginID.DALLE3)}
          >
            <IconBrush size={24} />
          </button>
          <span className="absolute bottom-14 scale-0 transition-all rounded bg-gray-800 p-4 text-center text-xs text-white group-hover:scale-100 w-48">
            Generate stunning images with DALL-E 3 🖌️
          </span>
        </div>*/}
      </div>
    </div>
  );
};
