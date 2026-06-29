const conectarRabbitMQ = require('../shared/conexionRabbit');
const fs = require('fs').promises;
const path = require('path');

const COLA_AUDITORIA = 'helpdesk.audit';
const EXCHANGE = 'helpdesk.events';
const ROUTING_KEY_ESCUCHA = 'ticket.#';   // captura ticket.created, ticket.assigned y futuras variantes
const ARCHIVO_AUDIT = path.join(__dirname, '..', 'data', 'audit.log');

(async () => {
  try {
    const { conexion, canal } = await conectarRabbitMQ();

    // Declarar la cola de auditoría
    await canal.assertQueue(COLA_AUDITORIA, { durable: false });
    console.log(`Cola "${COLA_AUDITORIA}" declarada`);

    // Vincularla al exchange con el patrón ticket.#
    await canal.bindQueue(COLA_AUDITORIA, EXCHANGE, ROUTING_KEY_ESCUCHA);
    console.log(`Cola "${COLA_AUDITORIA}" vinculada a "${EXCHANGE}" con "${ROUTING_KEY_ESCUCHA}"`);

    console.log('Audit worker esperando eventos...');

    // Consumir mensajes
    await canal.consume(COLA_AUDITORIA, async (mensaje) => {
      if (mensaje === null) return;

      try {
        const contenido = mensaje.content.toString();
        const evento = JSON.parse(contenido);
        const tipo = evento.type;
        const ticketId = evento.payload.ticketId;

        console.log(`[audit-worker] Registrado: ${tipo} - ${ticketId}`);

        // Agregar una línea al archivo de auditoría (se crea automáticamente si no existe)
        await fs.appendFile(ARCHIVO_AUDIT, contenido + '\n', 'utf-8');

        // Confirmar que el mensaje fue procesado correctamente
        canal.ack(mensaje);
      } catch (error) {
        console.error('[audit-worker] Error al procesar mensaje:', error.message);
        // No se hace ack para que el mensaje pueda ser reprocesado
      }
    });

    console.log('Audit worker activo (Ctrl+C para salir)');
  } catch (error) {
    console.error('Error al iniciar audit worker:', error.message);
    process.exit(1);
  }
})();

// Cierre ordenado
process.on('SIGINT', async () => {
  console.log('Cerrando audit worker...');
  process.exit(0);
});