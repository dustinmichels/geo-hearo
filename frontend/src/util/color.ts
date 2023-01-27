// import * as d3 from 'd3'
import { scaleLinear } from 'd3-scale'

export const getColor = scaleLinear()
  .domain([19969, 10])
  .range(['Linen', 'darkseagreen'])
