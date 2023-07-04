import './assets/main.css'
import './style.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import config from '../formkit.config.ts'
import { plugin, defaultConfig } from '@formkit/vue'

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

app.mount('#app')
