import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

export function useOnboarding() {
  const startTour = () => {
    const hasSeenOnboarding = localStorage.getItem('geo-hearo-onboarding-seen')

    // Always run for testing if needed, but per requirements usually we check.
    // User implies "When the user goes to the 'play' view I want to create an onboarding flow"
    // Usually means only once.
    if (hasSeenOnboarding) return

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
            description: 'Click a country on the map, then press "Guess."',
            side: 'left',
            align: 'center',
          },
        },
      ],
      onDestroyStarted: () => {
        if (
          !driverObj.hasNextStep() ||
          confirm('Are you sure used want to skip the tour?')
        ) {
          driverObj.destroy()
          localStorage.setItem('geo-hearo-onboarding-seen', 'true')
        }
      },
    })

    driverObj.drive()
  }

  const startResultsTour = () => {
    const hasSeenResultsTour = localStorage.getItem(
      'geo-hearo-results-tour-seen'
    )

    if (hasSeenResultsTour) return

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
              'See details about the stations you were just listening to.',
            side: placement,
            align: 'center',
          },
        },
        {
          element: '#new-game-btn',
          popover: {
            title: 'New Game',
            description:
              'Listen as long as you like! Click new game when ready.',
            side: placement,
            align: 'center',
          },
        },
      ],
      onDestroyStarted: () => {
        if (
          !driverObj.hasNextStep() ||
          confirm('Are you sure used want to skip the tour?')
        ) {
          driverObj.destroy()
          localStorage.setItem('geo-hearo-results-tour-seen', 'true')
        }
      },
    })

    driverObj.drive()
  }

  return {
    startTour,
    startResultsTour,
  }
}
