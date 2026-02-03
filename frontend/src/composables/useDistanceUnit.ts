import { ref } from 'vue'

export type DistanceUnit = 'mi' | 'km'

const KM_TO_MI = 0.621371
const MILE_REGIONS = ['US', 'GB', 'LR', 'MM']

function getDefaultUnit(): DistanceUnit {
  try {
    const locale = new Intl.Locale(navigator.language)
    if (locale.region && MILE_REGIONS.includes(locale.region)) {
      return 'mi'
    }
  } catch {
    // Fall through to km if locale parsing fails
  }
  return 'km'
}

const distanceUnit = ref<DistanceUnit>(getDefaultUnit())

export function useDistanceUnit() {
  const toggleUnit = () => {
    distanceUnit.value = distanceUnit.value === 'mi' ? 'km' : 'mi'
  }

  const formatDistance = (km: number | undefined): string => {
    if (km === undefined) return ''
    if (distanceUnit.value === 'km') {
      return `${Math.round(km).toLocaleString()} km`
    }
    return `${Math.round(km * KM_TO_MI).toLocaleString()} mi`
  }

  return {
    distanceUnit,
    toggleUnit,
    formatDistance,
  }
}
