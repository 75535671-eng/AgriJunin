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
import { decodePolyline, loadLeaflet } from '../../../core/utils/leaflet-map-loader';
import { MapsDirections } from '../../../models';

export interface LoteUbicacion {
  latitud: number;
  longitud: number;
  ubicacion: string;
}

type MapEngine = 'google' | 'leaflet';

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

  private mapEngine: MapEngine = 'google';
  private map?: google.maps.Map;
  private marker?: google.maps.Marker;
  private routeLine?: google.maps.Polyline;
  private leafletMap?: any;
  private leafletMarker?: any;
  private leafletRoute?: any;
  private centro = { lat: -12.06513, lng: -75.20486 };

  ngOnInit(): void {
    this.mapsApi.getConfig().subscribe({
      next: (res) => {
        const centro = res.data.centro;
        if (centro?.lat != null && centro?.lng != null) {
          this.centro = { lat: centro.lat, lng: centro.lng };
        }
        const apiKey = res.data.apiKey;
        const provider = res.data.provider;
        if (!apiKey || provider === 'osm') {
          this.startLeaflet();
          return;
        }
        loadGoogleMaps(apiKey)
          .then(() => {
            this.mapEngine = 'google';
            this.initGoogleMap();
          })
          .catch(() => this.startLeaflet());
      },
      error: () => this.startLeaflet(),
    });
  }

  ngOnDestroy(): void {
    this.routeLine?.setMap(null);
    this.leafletMap?.remove();
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

  private startLeaflet(): void {
    loadLeaflet()
      .then(() => {
        this.mapEngine = 'leaflet';
        this.initLeafletMap();
      })
      .catch(() => this.mapError.set('No se pudo cargar el mapa (OpenStreetMap).'));
  }

  private initGoogleMap(): void {
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

    this.finishMapInit(lat, lng);
  }

  private initLeafletMap(): void {
    const el = this.mapEl()?.nativeElement;
    const L = window.L;
    if (!el || !L) return;

    const lat = this.latitudInicial() ?? this.centro.lat;
    const lng = this.longitudInicial() ?? this.centro.lng;

    this.leafletMap = L.map(el).setView([lat, lng], this.latitudInicial() != null ? 14 : 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(this.leafletMap);

    this.leafletMarker = L.marker([lat, lng], { draggable: true }).addTo(this.leafletMap);
    this.leafletMarker.on('dragend', () => {
      const pos = this.leafletMarker?.getLatLng();
      if (pos) this.setLocation(pos.lat, pos.lng);
    });

    this.leafletMap.on('click', (e: { latlng: { lat: number; lng: number } }) => {
      this.setLocation(e.latlng.lat, e.latlng.lng);
    });

    this.finishMapInit(lat, lng);
  }

  private finishMapInit(lat: number, lng: number): void {
    this.loading.set(false);
    if (this.latitudInicial() != null && this.longitudInicial() != null) {
      this.setLocation(this.latitudInicial()!, this.longitudInicial()!, this.ubicacionInicial(), false);
    }
  }

  private setLocation(lat: number, lng: number, addressHint = '', emit = true): void {
    if (this.mapEngine === 'google') {
      this.marker?.setPosition({ lat, lng });
      this.map?.setCenter({ lat, lng });
    } else {
      this.leafletMarker?.setLatLng([lat, lng]);
      this.leafletMap?.setView([lat, lng], this.leafletMap?.getZoom?.() ?? 14);
    }

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
        if (!poly) return;

        if (this.mapEngine === 'google' && this.map && window.google?.maps?.geometry) {
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
          return;
        }

        if (this.mapEngine === 'leaflet' && this.leafletMap && window.L) {
          const path = decodePolyline(poly).map((p) => [p.lat, p.lng] as [number, number]);
          this.leafletRoute?.remove();
          this.leafletRoute = window.L.polyline(path, {
            color: '#2e7d32',
            weight: 4,
            opacity: 0.85,
          }).addTo(this.leafletMap);
          this.leafletMap.fitBounds(this.leafletRoute.getBounds(), { padding: [24, 24] });
        }
      },
    });
  }
}
