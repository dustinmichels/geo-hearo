import { createApp } from 'vue'
import App from './App.vue'
import './assets/styles/tokens.css'
import router from './router'

createApp(App).use(router).mount('#app')
