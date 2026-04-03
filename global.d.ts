declare module 'virtual:pwa-register/react' {
  import type { Dispatch, SetStateAction } from 'react';
  import type { RegisterSWOptions } from 'vite-plugin-pwa/types';

  export type { RegisterSWOptions };

  export function useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: [boolean, Dispatch<SetStateAction<boolean>>];
    offlineReady: [boolean, Dispatch<SetStateAction<boolean>>];
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  };
}

// Google Analytics gtag declarations
interface GtagConfig {
  send_page_view?: boolean;
  anonymize_ip?: boolean;
  allow_google_signals?: boolean;
  allow_ad_personalization_signals?: boolean;
  transport_type?: 'beacon' | 'xhr' | 'image';
  custom_map?: Record<string, string>;
  [key: string]: any;
}

declare global {
  interface Window {
    gtag: (command: 'config' | 'js' | 'event' | 'set', targetOrDate: string | Date, config?: GtagConfig | any) => void;
    dataLayer: any[];
  }
}

declare module '*?raw' {
  const content: string;
  export default content;
}