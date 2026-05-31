const { CrudService } = require('./crud.service');

const crud = new CrudService(
  'cultivos',
  ['nombre', 'nombre_cientifico', 'tipo', 'temporada', 'dias_crecimiento', 'rendimiento_promedio', 'humedad_optima_min', 'humedad_optima_max', 'temp_optima_min', 'temp_optima_max', 'descripcion', 'activo'],
  'nombre ASC'
);

module.exports = crud;
