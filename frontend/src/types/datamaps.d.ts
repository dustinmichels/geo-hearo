declare module 'datamaps' {
  interface DatamapOptions {
    element: HTMLElement
    responsive?: boolean
    projection?: string
    geographyConfig?: {
      hideAntarctica?: boolean
      hideHawaiiAndAlaska?: boolean
      borderWidth?: number
      borderOpacity?: number
      borderColor?: string
      popupOnHover?: boolean
      highlightOnHover?: boolean
      highlightFillColor?: string
      highlightBorderColor?: string
      highlightBorderWidth?: number
      highlightBorderOpacity?: number
    }
    fills?: {
      defaultFill?: string
      [key: string]: string
    }
    done?: (map: any) => void
  }

  class Datamap {
    constructor(options: DatamapOptions)
    resize(): void
  }

  export default Datamap
}
