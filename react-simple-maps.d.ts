declare module "react-simple-maps" {
  import { FC } from "react"
  export const ComposableMap: FC<any>
  export const Geographies: FC<any>
  export const Geography: FC<any>
  export const Marker: FC<any>
}

declare module "topojson-client" {
  export function feature(topology: any, object: any): any
}
