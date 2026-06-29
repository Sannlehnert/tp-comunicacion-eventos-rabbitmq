const fs = require('fs').promises;
const path = require('path');

const RUTA_METRICAS = path.join(__dirname, '..', 'data', 'metrics.json');
const RUTA_PROCESADOS = path.join(__dirname, '..', 'data', 'processed-events.json');

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

async function verificarYRegistrarEvento(eventId) {
  let procesados = [];

  try {
    const contenido = await fs.readFile(RUTA_PROCESADOS, 'utf-8');
    procesados = JSON.parse(contenido);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error al leer processed-events.json:', error.message);
    }
  }

  if (procesados.includes(eventId)) {
    return false;
  }

  procesados.push(eventId);
  await fs.writeFile(RUTA_PROCESADOS, JSON.stringify(procesados, null, 2), 'utf-8');
  return true;
}

module.exports = { incrementarContadorDiario, verificarYRegistrarEvento };