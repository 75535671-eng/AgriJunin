import { Component, inject, OnInit, signal } from '@angular/core';
import { form, FormField, max, min, required } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CultivosStore } from '../../services/entity.service';
import { LookupService } from '../../services/lookup.service';
import { PlantasService } from '../../services/plantas.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { EspeciePlanta } from '../../models';
import { firstFieldError, showFieldError, touchFields } from '../../shared/utils/form-signals';

@Component({
  selector: 'app-cultivo-form',
  imports: [FormField, RouterLink],
  providers: [CultivosStore],
  templateUrl: './cultivo-form.component.html',
  styleUrl: './cultivo-form.component.scss',
})
export class CultivoFormComponent implements OnInit {
  private readonly store = inject(CultivosStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly plantasApi = inject(PlantasService);
  protected readonly lookup = inject(LookupService);
  protected readonly auth = inject(AuthStateService);

  protected readonly isEdit = signal(false);
  protected readonly lotesDisponibles = () => this.lookup.lotes();
  protected readonly busqueda = signal('');
  protected readonly buscandoPlantas = signal(false);
  protected readonly resultadosPlantas = signal<EspeciePlanta[]>([]);
  protected readonly errorPlantas = signal<string | null>(null);
  protected readonly especieSeleccionada = signal<string | null>(null);
  protected readonly showFieldError = showFieldError;
  protected readonly firstFieldError = firstFieldError;

  private id?: number;

  private readonly cultivoModel = signal({
    lote_solicitud_id: '',
    nombre: '',
    nombre_cientifico: '',
    tipo: 'tuberculo',
    temporada: 'todo_año',
    dias_crecimiento: 90,
    rendimiento_promedio: 0,
    descripcion: '',
    activo: true,
  });

  protected readonly cultivoForm = form(this.cultivoModel, (path) => {
    required(path.lote_solicitud_id, {
      when: () => this.auth.isAgricultor(),
      message: 'Seleccione un lote',
    });
    required(path.nombre, { message: 'Nombre requerido' });
    required(path.tipo, { message: 'Tipo requerido' });
    min(path.dias_crecimiento, 1, { message: 'Mínimo 1 día' });
    max(path.dias_crecimiento, 365, { message: 'Máximo 365 días' });
  });

  titulo = () => {
    if (this.auth.isAgricultor()) {
      return this.isEdit() ? 'Editar solicitud de cultivo' : 'Solicitar nuevo cultivo';
    }
    return this.isEdit() ? 'Editar cultivo' : 'Nuevo cultivo';
  };

  ngOnInit(): void {
    this.lookup.loadLotes({ soloAprobados: true });

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'nuevo') {
      this.isEdit.set(true);
      this.id = +id;
      this.store.getById(this.id).subscribe((r) => {
        const data = r.data;
        this.cultivoModel.set({
          lote_solicitud_id: data.lote_solicitud_id != null ? String(data.lote_solicitud_id) : '',
          nombre: data.nombre,
          nombre_cientifico: data.nombre_cientifico || '',
          tipo: data.tipo,
          temporada: data.temporada || 'todo_año',
          dias_crecimiento: data.dias_crecimiento ?? 90,
          rendimiento_promedio: data.rendimiento_promedio ?? 0,
          descripcion: data.descripcion || '',
          activo: !!data.activo,
        });
        if (data.nombre_cientifico) {
          this.especieSeleccionada.set(data.nombre_cientifico);
        }
      });
    }
  }

  onBusquedaInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.busqueda.set(value);
    this.errorPlantas.set(null);
  }

  buscarPlantas(): void {
    const q = this.busqueda().trim();
    if (q.length < 2) {
      this.errorPlantas.set('Ingrese al menos 2 caracteres');
      return;
    }
    this.buscandoPlantas.set(true);
    this.errorPlantas.set(null);
    this.resultadosPlantas.set([]);
    this.plantasApi.buscar(q).subscribe({
      next: (res) => {
        this.resultadosPlantas.set(res.data.resultados);
        if (!res.data.resultados.length) {
          this.errorPlantas.set('No se encontraron especies. Pruebe en español o inglés.');
        }
        this.buscandoPlantas.set(false);
      },
      error: (err) => {
        this.errorPlantas.set(err?.error?.message || 'Error al buscar especies');
        this.buscandoPlantas.set(false);
      },
    });
  }

  aplicarEspecie(p: EspeciePlanta): void {
    this.cultivoModel.update((m) => ({
      ...m,
      nombre: p.nombre,
      nombre_cientifico: p.nombre_cientifico,
      tipo: p.tipo_sugerido as never,
      temporada: p.temporada_sugerida as never,
      descripcion: p.descripcion_sugerida || m.descripcion,
    }));
    this.especieSeleccionada.set(p.nombre_cientifico);
    this.resultadosPlantas.set([]);
    this.busqueda.set(p.nombre);
  }

  save(): void {
    touchFields(
      this.cultivoForm.lote_solicitud_id,
      this.cultivoForm.nombre,
      this.cultivoForm.tipo,
      this.cultivoForm.dias_crecimiento
    );
    if (this.cultivoForm().invalid()) {
      return;
    }
    const raw = this.cultivoModel();
    const body = {
      ...raw,
      lote_solicitud_id: raw.lote_solicitud_id ? Number(raw.lote_solicitud_id) : undefined,
    };
    const req =
      this.isEdit() && this.id ? this.store.update(this.id, body) : this.store.create(body);
    req.subscribe({
      next: (res) => {
        alert(res.message || 'Guardado');
        this.router.navigate(['/cultivos']);
      },
      error: (err) => alert(err?.error?.message || 'Error al guardar'),
    });
  }
}
