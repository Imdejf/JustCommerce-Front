/// <reference types="vite/client" />
interface ImportMetaEnv {
  VITE_VUE_APP_I18N_LOCALE: string;
  VITE_VUE_APP_I18N_FALLBACK_LOCALE: string;
  VITE_ALLEGRO_DEFAULT_STORE_ID: string;
  VITE_ALLEGRO_DEFAULT_LANGUAGE_ID: string;
  VITE_ALLEGRO_DEFAULT_USER_ID: string;
  VITE_ALLEGRO_DEFAULT_COUNTRY_ID: string;
  VITE_ALLEGRO_DEFAULT_STATE_PROVINCE_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}