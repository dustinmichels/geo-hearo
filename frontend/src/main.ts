import { createApp } from 'vue'
import App from './App.vue'
import 'vant/lib/index.css'
import './assets/styles/style.css'
import router from './router'
import { init, track } from '@plausible-analytics/tracker'

// 1. Initialize and store the instance
init({
  domain: 'geohearo.com',
  endpoint: 'https://geohearo.com/stats/api/event', // Your proxy endpoint
  autoCapturePageviews: false, // Disable auto-capture since we're tracking manually
})

// 2. Track pageviews on every route change
router.afterEach((to) => {
  track('pageview', {
    url: window.location.origin + to.fullPath,
  })
})

createApp(App).use(router).mount('#app')
