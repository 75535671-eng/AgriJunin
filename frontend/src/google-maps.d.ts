/* eslint-disable @typescript-eslint/no-explicit-any */
declare namespace google.maps {
  class Map {
    constructor(el: HTMLElement, opts?: any);
    setCenter(latLng: LatLng | LatLngLiteral): void;
    setZoom(z: number): void;
    fitBounds(b: LatLngBounds): void;
    addListener(event: string, fn: (e: any) => void): void;
  }
  class Marker {
    constructor(opts?: any);
    setPosition(p: LatLngLiteral): void;
    getPosition(): LatLng | null | undefined;
    addListener(event: string, fn: () => void): void;
  }
  class Polyline {
    constructor(opts?: any);
    setMap(map: Map | null): void;
  }
  class LatLngBounds {
    extend(p: LatLngLiteral): void;
  }
  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }
  interface LatLngLiteral {
    lat: number;
    lng: number;
  }
  namespace geometry {
    namespace encoding {
      function decodePath(encoded: string): LatLngLiteral[];
    }
  }
}

declare const google: { maps: typeof google.maps };
