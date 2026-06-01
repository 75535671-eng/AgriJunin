const https = require('https');

const consultarDni = (dni) =>
  new Promise((resolve, reject) => {
    const token = process.env.APISPERU_DNI_TOKEN;
    if (!token) {
      return reject(new Error('Token APIS Peru no configurado en el servidor'));
    }

    const url = `https://dniruc.apisperu.com/api/v1/dni/${dni}?token=${encodeURIComponent(token)}`;

    https
      .get(url, { family: 4 }, (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          try {
            const data = JSON.parse(raw);
            if (!data.success) {
              return reject(new Error('DNI no encontrado en RENIEC'));
            }
            const nombres = String(data.nombres || '').trim();
            const apellidos = `${data.apellidoPaterno || ''} ${data.apellidoMaterno || ''}`.trim();
            resolve({
              dni: data.dni,
              nombres,
              apellidos,
              nombreCompleto: `${nombres} ${apellidos}`.trim(),
              codVerifica: data.codVerifica,
            });
          } catch {
            reject(new Error('Respuesta inválida del servicio de DNI'));
          }
        });
      })
      .on('error', () => reject(new Error('No se pudo consultar el DNI. Verifique su conexión.')));
  });

module.exports = { consultarDni };
