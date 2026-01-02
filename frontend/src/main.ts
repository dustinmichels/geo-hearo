import { createApp } from 'vue'
import App from './App.vue'
import './assets/styles/style.css'
import 'vant/lib/index.css'
import router from './router'

createApp(App).use(router).mount('#app')
