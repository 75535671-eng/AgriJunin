import {
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MapsService } from '../../../services/maps.service';
import { loadGoogleMaps } from '../../../core/utils/google-maps-loader';
import { MapsDirections } from '../../../models';

export interface LoteUbicacion {
  latitud: number;
  longitud: number;
  ubicacion: string;
}

@Component({
  selector: 'app-lote-map-picker',
  templateUrl: './lote-map-picker.component.html',
  styleUrl: './lote-map-picker.component.scss',
})
export class LoteMapPickerComponent implements OnInit, OnDestroy {
  private readonly mapsApi = inject(MapsService);
  private readonly mapEl = viewChild<ElementRef<HTMLDivElement>>('mapCanvas');

  readonly latitudInicial = input<number | null>(null);
  readonly longitudInicial = input<number | null>(null);
  readonly ubicacionInicial = input<string>('');

  readonly ubicacionChange = output<LoteUbicacion>();

  protected readonly loading = signal(true);
  protected readonly mapError = signal<string | null>(null);
  protected readonly routeInfo = signal<MapsDirections | null>(null);
  protected readonly coordsLabel = signal('');

  private map?: google.maps.Map;
  private marker?: google.maps.Marker;
  private routeLine?: google.maps.Polyline;
  private centro = { lat: -12.06513, lng: -75.20486 };

  ngOnInit(): void {
    this.mapsApi.getConfig().subscribe({
      next: (res) => {
        this.centro = res.data.centro;
        loadGoogleMaps(res.data.apiKey)
          .then(() => this.initMap())
          .catch(() => this.mapError.set('No se pudo cargar el mapa. Verifique GOOGLE_MAPS_API_KEY.'));
      },
      error: (err) => {
        this.loading.set(false);
        this.mapError.set(err?.error?.message || 'Mapas no disponibles en el servidor');
      },
    });
  }

  ngOnDestroy(): void {
    this.routeLine?.setMap(null);
  }

  usarMiUbicacion(): void {
    if (!navigator.geolocation) {
      this.mapError.set('Su navegador no soporta geolocalización');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => this.setLocation(pos.coords.latitude, pos.coords.longitude),
      () => this.mapError.set('No se pudo obtener su ubicación')
    );
  }

  private initMap(): void {
    const el = this.mapEl()?.nativeElement;
    if (!el || !window.google?.maps) return;

    const lat = this.latitudInicial() ?? this.centro.lat;
    const lng = this.longitudInicial() ?? this.centro.lng;

    this.map = new google.maps.Map(el, {
      center: { lat, lng },
      zoom: this.latitudInicial() != null ? 14 : 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    this.marker = new google.maps.Marker({
      map: this.map,
      position: { lat, lng },
      draggable: true,
      title: 'Ubicación del lote',
    });

    this.marker.addListener('dragend', () => {
      const p = this.marker?.getPosition();
      if (p) this.setLocation(p.lat(), p.lng());
    });

    this.map.addListener('click', (e: { latLng?: google.maps.LatLng }) => {
      const ll = e.latLng;
      if (ll) this.setLocation(ll.lat(), ll.lng());
    });

    this.loading.set(false);
    if (this.latitudInicial() != null && this.longitudInicial() != null) {
      this.setLocation(this.latitudInicial()!, this.longitudInicial()!, this.ubicacionInicial(), false);
    }
  }

  private setLocation(lat: number, lng: number, addressHint = '', emit = true): void {
    this.marker?.setPosition({ lat, lng });
    this.map?.setCenter({ lat, lng });
    this.coordsLabel.set(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    this.mapError.set(null);

    this.mapsApi.reverseGeocode(lat, lng).subscribe({
      next: (geo) => {
        const ubicacion = addressHint || geo.data.direccion;
        this.drawRoute(lat, lng);
        if (emit) {
          this.ubicacionChange.emit({ latitud: lat, longitud: lng, ubicacion });
        }
      },
    });
  }

  private drawRoute(lat: number, lng: number): void {
    this.mapsApi.getDirections(lat, lng).subscribe({
      next: (res) => {
        this.routeInfo.set(res.data);
        const poly = res.data.polyline;
        if (!poly || !this.map || !window.google?.maps?.geometry) return;

        this.routeLine?.setMap(null);
        const path = google.maps.geometry.encoding.decodePath(poly);
        this.routeLine = new google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: '#2e7d32',
          strokeOpacity: 0.85,
          strokeWeight: 4,
          map: this.map,
        });

        const bounds = new google.maps.LatLngBounds();
        path.forEach((p) => bounds.extend(p));
        this.map.fitBounds(bounds);
      },
    });
  }
}
