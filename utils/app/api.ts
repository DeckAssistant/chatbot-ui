import { Plugin, PluginID } from '@/types/plugin';

export const getEndpoint = (plugin: Plugin | null) => {
  if (!plugin) {
    return 'api/chat';
  }

  if (plugin.id === PluginID.GOOGLE_SEARCH) {
    return 'api/google';
  }
  else if (plugin.id === PluginID.DALLE3) {
    return 'api/dalle';
  }

  return 'api/chat';
};
