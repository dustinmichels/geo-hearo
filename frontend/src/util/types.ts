export interface Centers {
  type: string
  features: FeaturesEntity[]
}
export interface FeaturesEntity {
  type: string
  geometry: Geometry
  properties: Properties
}
export interface Geometry {
  type: string
  coordinates: number[]
}
export interface Properties {
  COUNTRY: string
  ISO: string
  COUNTRYAFF: string
  AFF_ISO: string
}
