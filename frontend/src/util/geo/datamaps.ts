import json from '../../assets/data/datamaps.json'

export interface DatamapsJson {
  type: string
  properties: {
    name: string
  }
  id: string
  arcs?: ((number | number[] | null)[] | null)[] | null
}

export const getAllCodes = () => {
  const countries = json as DatamapsJson[]
  const codes = countries.map((x) => x.id)
  return codes
}
