const conectarRabbitMQ = require('../shared/conexionRabbit');

(async () => {
  try {
    const { conexion, canal } = await conectarRabbitMQ();
    console.log('🔌 Prueba de conexión finalizada correctamente.');

    // Cerramos prolijamente (en fases futuras la conexión se mantendrá abierta)
    await canal.close();
    await conexion.close();
    process.exit(0);
  } catch (error) {
    console.error('Error en la conexión:', error.message);
    process.exit(1);
  }
})();