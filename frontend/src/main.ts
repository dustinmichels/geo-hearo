import { createApp } from 'vue'
import App from './App.vue'
import 'vant/lib/index.css'
import './assets/styles/style.css'
import router from './router'
import { init } from '@plausible-analytics/tracker'

init({
  domain: 'geohearo.com',
})

createApp(App).use(router).mount('#app')
