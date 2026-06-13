import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/services/api.service';
import { MapsConfig, MapsDirections, MapsGeocode } from '../models';

@Injectable({ providedIn: 'root' })
export class MapsService {
  private readonly api = inject(ApiService);

  getConfig() {
    return this.api.get<MapsConfig>('maps/config');
  }

  getDirections(lat: number, lng: number) {
    return this.api.get<MapsDirections>('maps/directions', { lat, lng });
  }

  reverseGeocode(lat: number, lng: number) {
    return this.api.get<MapsGeocode>('maps/geocode', { lat, lng });
  }
}
