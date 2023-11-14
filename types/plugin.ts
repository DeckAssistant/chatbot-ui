import { KeyValuePair } from './data';

export interface Plugin {
  id: PluginID;
  name: PluginName;
  requiredKeys: KeyValuePair[];
}

export interface PluginKey {
  pluginId: PluginID;
  requiredKeys: KeyValuePair[];
}

export enum PluginID {
  GOOGLE_SEARCH = 'google-search',
  DALLE3 = 'dalle-3',
}

export enum PluginName {
  GOOGLE_SEARCH = 'Google Search',
  DALLE3 = 'DALL-E 3',
}

export const Plugins: Record<PluginID, Plugin> = {
  [PluginID.GOOGLE_SEARCH]: {
    id: PluginID.GOOGLE_SEARCH,
    name: PluginName.GOOGLE_SEARCH,
    requiredKeys: [
      {
        key: 'GOOGLE_API_KEY',
        value: '',
      },
      {
        key: 'GOOGLE_CSE_ID',
        value: '',
      },
    ],
  },
  [PluginID.DALLE3]: {
    id: PluginID.DALLE3,
    name: PluginName.DALLE3,
    requiredKeys: [],
  },
};

export const PluginList = Object.values(Plugins);
