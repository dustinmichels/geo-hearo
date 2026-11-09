import type { Feature, Geometry, FeatureCollection } from "geojson";
import { shallowRef } from "vue";
import type { NeCountryProperties } from "../types/geo";

// State
// Maps ADMIN name -> GeoJSON Feature
const adminToFeature = shallowRef<Map<string, Feature<Geometry, NeCountryProperties>>>(new Map());
const geoJsonData = shallowRef<FeatureCollection<Geometry, NeCountryProperties> | null>(null);
let loadPromise: Promise<void> | null = null;

export function useCountryData() {
  const loadCountryData = (): Promise<void> => {
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
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
        loadPromise = null; // Reset promise to allow retry on error
        throw e;
      }
    })();

    return loadPromise;
  };

  const getFeature = (countryAdmin: string): Feature<Geometry, NeCountryProperties> | undefined => {
    return adminToFeature.value.get(countryAdmin);
  };

  return {
    geoJsonData,
    loadCountryData,
    getFeature,
  };
}
