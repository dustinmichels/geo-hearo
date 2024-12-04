import json from '../../assets/data/datamaps.json'

export interface DatamapsJson {
  type: string
  properties: {
    name: string
  }
  id: string
  arcs?: ((number | number[] | null)[] | null)[] | null
}

export const loadDatamapsData = () => {
  return json as DatamapsJson[]
}

const countries = json as DatamapsJson[]

export const getAllCodes = () => {
  const codes = countries.map((x) => x.id)
  return codes
}
