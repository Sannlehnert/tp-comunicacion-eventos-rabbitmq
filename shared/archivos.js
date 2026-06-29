const fs = require('fs').promises;
const path = require('path');

const RUTA_METRICAS = path.join(__dirname, '..', 'data', 'metrics.json');

async function incrementarContadorDiario() {
  let metricas = {};

  try {
    const contenido = await fs.readFile(RUTA_METRICAS, 'utf-8');
    metricas = JSON.parse(contenido);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error al leer metrics.json:', error.message);
    }
  }

  const hoy = new Date().toISOString().split('T')[0];

  if (metricas[hoy]) {
    metricas[hoy] += 1;
  } else {
    metricas[hoy] = 1;
  }

  await fs.writeFile(RUTA_METRICAS, JSON.stringify(metricas, null, 2), 'utf-8');
  console.log(`Metrica actualizada: ${hoy} -> ${metricas[hoy]} tickets`);
}

module.exports = { incrementarContadorDiario };