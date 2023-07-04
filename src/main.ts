import './assets/main.css'
import './style.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import { plugin, defaultConfig } from '@formkit/vue'
import config from '../formkit.config.ts'
import ContentContainer from './layouts/ContentContainer.vue'
import DropZone from 'dropzone-vue';
import 'dropzone-vue/dist/dropzone-vue.common.css';
import FormSection from './components/Form/Section/FormSection.vue'
import HtmlEditor from './components/Form/Editor/HtmlEditor.vue'
import ConfirmModal from './components/Form/Modal/ConfirmModal.vue'
import InfoBox from './components/Form/Box/InfoBox.vue'
import DropDown from './components/Form/DropDown/DropDown.vue'

import Toast, { PluginOptions } from "vue-toastification";
import "vue-toastification/dist/index.css";

/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'

/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

/* import specific icons */
import { faBold, faItalic, faUnderline, faStrikethrough, faAlignLeft, faAlignCenter, faAlignRight, faAlignJustify, faList, faListNumeric, faSubscript, faSuperscript, faTextSlash, faArrowRotateRight, faArrowRotateLeft  } from '@fortawesome/free-solid-svg-icons'

/* add icons to the library */
library.add(faBold)
library.add(faItalic)
library.add(faUnderline)
library.add(faStrikethrough)
library.add(faAlignLeft)
library.add(faAlignCenter)
library.add(faAlignRight)
library.add(faAlignJustify)
library.add(faList)
library.add(faListNumeric)
library.add(faSubscript)
library.add(faSuperscript)
library.add(faTextSlash)
library.add(faArrowRotateRight)
library.add(faArrowRotateLeft)

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus);
app.use(plugin, defaultConfig(config))
app.use(DropZone)

const optionsToast: PluginOptions = {
    // You can set your default options here
};

app.use(Toast, optionsToast);

app.component('ContentContainer', ContentContainer)
app.component('FormSection', FormSection)
app.component('HtmlEditor', HtmlEditor)
app.component('ConfirmModal', ConfirmModal)
app.component('InfoBox', InfoBox)
app.component('DropDown', DropDown)

.component('font-awesome-icon', FontAwesomeIcon)


app.mount('#app')
