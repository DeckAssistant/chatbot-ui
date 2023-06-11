import { FC, useContext, useEffect, useState, useRef } from 'react';
import Papa from 'papaparse';
import HomeContext from '@/pages/api/home/home.context';

interface Props {
  open: boolean;
  onClose: () => void;
  onUseButtonClick: (message: string) => void;
}

interface State {
  data: { act: string; prompt: string; }[];
  searchValue: string;
}

export const PromptLibraryModal: FC<Props> = ({ open, onClose, onUseButtonClick }) => {
  const {
    dispatch: homeDispatch,
  } = useContext(HomeContext);
  const modalRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<State['data']>([]);
  const [searchValue, setSearchValue] = useState<State['searchValue']>('');

  const loadData = () => {
    fetch('https://raw.githubusercontent.com/DeckAssistant/awesome-chatgpt-prompts/main/prompts.csv')
      .then(response => response.text())
      .then(csv => {
        const parsedCSV = Papa.parse(csv.trim(), {header: true}).data;
        const parsedData: State['data'] = parsedCSV.map((row: any) => ({ act: row.act, prompt: row.prompt }));
        setData(parsedData);
      });
  };

  useEffect(() => {
    loadData();

    const handleMouseDown = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        window.addEventListener('mouseup', handleMouseUp);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      window.removeEventListener('mouseup', handleMouseUp);
      onClose();
    };

    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [onClose]);

  // Render nothing if the dialog is not open.
  if (!open) {
    return <></>;
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
  };

  const handleUseButtonClick = (message: string) => {
    onUseButtonClick(message);
    onClose();
  };

  const filteredData = data.filter(({act, prompt}) =>
    act.toLowerCase().includes(searchValue.toLowerCase()) ||
    prompt.toLowerCase().includes(searchValue.toLowerCase())
  );


  // Render the dialog.
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="fixed inset-0 z-10 overflow-hidden">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div
            className="hidden sm:inline-block sm:h-screen sm:align-middle"
            aria-hidden="true"
          />

            <div
              ref={modalRef}
              className="dark:border-netural-400 inline-block max-h-[400px] transform overflow-y-auto rounded-md border border-gray-600 bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all dark:bg-[#202123] sm:my-8 sm:max-h-[600px] sm:w-full sm:max-w-lg sm:p-6 sm:align-middle"
              role="dialog"
            >

              <div className="pb-4 flex items-center justify-between border-b border-black/10 dark:border-white/10">
                <div className="flex items-center">
                  <div className="text-center sm:text-left">
                    <h2 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-200">Prompt Library</h2>
                  </div>
                </div>
                <button className="inline-block text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    onClose();
                  }}>
                  <svg stroke="currentColor" fill="none" viewBox="0 0 24 24"
                     className="text-gray-900 dark:text-gray-200"
                    height="20" width="20" xmlns="http://www.w3.org/2000/svg">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div>
                <input
                    type="text"
                    placeholder="Search prompts"
                    value={searchValue}
                    onChange={handleSearchChange}
                    className="mt-2 flex-1 rounded-md border border-neutral-600 bg-[#202123] px-4 py-3 pr-10 text-[14px] leading-3 text-white text-sm"
                  />
              </div>
            <div>

            {filteredData.map(({act, prompt}) => (
                <div className="p-4 mt-2 border border-gray-200 dark:border-gray-600 rounded shadow-sm mb-4 flex items-center justify-between space-x-2 gap-3" key={act}>
                  <div className="w-full">
                    <div className="flex items-center justify-start gap-2">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white">{act}</h3>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-gray-500 text-sm">{prompt.slice(0, 100)}...</p>
                      </div>
                      <div className="text-right shrink-0">
                        <button onClick={() => handleUseButtonClick(prompt)} className="flex w-fit text-sm items-center gap-3 rounded border border-neutral-200 bg-white py-2 px-4 text-black hover:opacity-50 dark:border-neutral-600 dark:bg-[#343541] dark:text-white">
                          Use
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
            ))}
            </div>

              <div className="mx-auto text-center">
                <button
                  type="button"
                  className="w-full px-4 py-2 mt-6 text-lg justify-center text-center flex w-fit items-center gap-3 rounded border border-neutral-200 bg-white py-2 px-4 text-black hover:opacity-50 dark:border-neutral-600 dark:bg-[#343541] dark:text-white"
                  onClick={() => {
                    onClose();
                  }}
                >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
