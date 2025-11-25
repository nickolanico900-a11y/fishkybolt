/// <reference types="vite/client" />

interface Window {
  fbq: (
    action: 'track' | 'trackCustom' | 'init',
    eventName: string,
    data?: Record<string, any>
  ) => void;
  _fbq?: any;
  dataLayer?: any[];
}
