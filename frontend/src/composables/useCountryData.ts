import type { Feature, Geometry, FeatureCollection } from "geojson";
import { ref, shallowRef } from "vue";
import type { NeCountryProperties } from "../types/geo";

// State
// Maps ADMIN name -> GeoJSON Feature
const adminToFeature = shallowRef<Map<string, Feature<Geometry, NeCountryProperties>>>(new Map());
const geoJsonData = shallowRef<FeatureCollection<Geometry, NeCountryProperties> | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
let loadPromise: Promise<void> | null = null;

export function useCountryData() {
  const loadCountryData = (): Promise<void> => {
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
      isLoading.value = true;
      error.value = null;
      try {
        // Load Country Geometries
        const countriesResponse = await fetch("/data/ne_countries.geojson");
        if (!countriesResponse.ok) throw new Error("Failed to load countries");
        const countriesData = (await countriesResponse.json()) as FeatureCollection<
          Geometry,
          NeCountryProperties
        >;
        geoJsonData.value = countriesData;

        const adminToF = new Map<string, Feature<Geometry, NeCountryProperties>>();

        if (countriesData.features) {
          countriesData.features.forEach((feature) => {
            const props = feature.properties as NeCountryProperties;
            if (props && props.ADMIN) {
              adminToF.set(props.ADMIN, feature);
            }
          });
        }
        adminToFeature.value = adminToF;
      } catch (e: unknown) {
        console.error("Failed to load country data:", e);
        error.value = e instanceof Error ? e.message : "Unknown error";
        loadPromise = null; // Reset promise to allow retry on error
        throw e;
      } finally {
        isLoading.value = false;
      }
    })();

    return loadPromise;
  };

  const getFeature = (countryAdmin: string): Feature<Geometry, NeCountryProperties> | undefined => {
    return adminToFeature.value.get(countryAdmin);
  };

  return {
    isLoading,
    error,
    geoJsonData,
    loadCountryData,
    getFeature,
  };
}
