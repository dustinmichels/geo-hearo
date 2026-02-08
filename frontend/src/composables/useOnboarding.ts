import { ref } from 'vue'
import { driver, type Driver } from 'driver.js'
import 'driver.js/dist/driver.css'

const isTourActive = ref(false)
let activeDriver: Driver | null = null
let activeTourKey: string | null = null

function skipTour() {
  if (activeDriver) {
    activeDriver.destroy()
  }
  if (activeTourKey) {
    localStorage.setItem(activeTourKey, 'true')
  }
  activeDriver = null
  activeTourKey = null
  isTourActive.value = false
}

export function useOnboarding() {
  const startTour = () => {
    const key = 'geo-hearo-onboarding-seen'
    if (localStorage.getItem(key)) return

    activeTourKey = key
    const driverObj = driver({
      showProgress: true,
      steps: [
        {
          element: '#tour-play-btn',
          popover: {
            title: 'Play Radio',
            description: 'Click to stream radio from the mystery country.',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#tour-skip-forward-btn',
          popover: {
            title: 'Change Station',
            description:
              'You have five random stations to choose from, all from the same country.',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#tour-map-container',
          popover: {
            title: 'Make a guess',
            description: 'Select a country on the map, then press "Guess."',
            side: 'left',
            align: 'center',
          },
        },
      ],
      onDestroyStarted: () => {
        driverObj.destroy()
        localStorage.setItem(key, 'true')
        activeDriver = null
        activeTourKey = null
        isTourActive.value = false
      },
    })

    activeDriver = driverObj
    isTourActive.value = true
    driverObj.drive()
  }

  const startResultsTour = () => {
    const key = 'geo-hearo-results-tour-seen'
    if (localStorage.getItem(key)) return

    activeTourKey = key
    const isMobile = window.innerWidth < 1024
    const placement = isMobile ? 'top' : 'left'

    const driverObj = driver({
      showProgress: true,
      steps: [
        {
          element: '#station-details-panel',
          popover: {
            title: 'Station Details',
            description:
              'Nice job! Now you can see details about the stations you were just listening to.',
            side: placement,
            align: 'center',
          },
        },
        {
          element: '#new-game-btn',
          popover: {
            title: "When you're ready",
            description:
              'Listen as long as you like! Click new game when ready.',
            side: placement,
            align: 'center',
          },
        },
      ],
      onDestroyStarted: () => {
        driverObj.destroy()
        localStorage.setItem(key, 'true')
        activeDriver = null
        activeTourKey = null
        isTourActive.value = false
      },
    })

    activeDriver = driverObj
    isTourActive.value = true
    driverObj.drive()
  }

  return {
    startTour,
    startResultsTour,
    isTourActive,
    skipTour,
  }
}
