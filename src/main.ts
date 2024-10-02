import { createApp, ref } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import vuetify from './plugins/vuetify';
import '@/scss/style.scss';
import { PerfectScrollbarPlugin } from 'vue3-perfect-scrollbar';
import VueTablerIcons from 'vue-tabler-icons';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import axios from 'axios'

// google-fonts
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/500.css';
import '@fontsource/public-sans/600.css';
import '@fontsource/public-sans/700.css';

//i18
import { createI18n } from 'vue-i18n';
import messages from '@/utils/locales/messages';
const activeLanguage = ref(localStorage.getItem('language') || 'en');
const i18n = createI18n({
  legacy:false,
  locale: activeLanguage.value,
  messages: messages,
  silentTranslationWarn: true,
  silentFallbackWarn: true
});



const app = createApp(App);
app.config.globalProperties.$axios = axios
app.use(router);
app.use(PerfectScrollbarPlugin);
app.use(createPinia());
app.use(VueTablerIcons);
app.use(Antd);
app.use(i18n);
app.use(vuetify).mount('#app');
