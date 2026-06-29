const conectarRabbitMQ = require('../shared/conexionRabbit');
const { crearEvento } = require('../shared/eventos');
const publicarEvento = require('../shared/publicador');

const COLA_ASIGNACION = 'helpdesk.assignment';
const EXCHANGE = 'helpdesk.events';
const ROUTING_KEY_ENTRADA = 'ticket.created.*';   // captura high, normal y low
const ROUTING_KEY_SALIDA = 'ticket.assigned';
const RESPONSABLE = 'Juan Perez';

(async () => {
  try {
    const { conexion, canal } = await conectarRabbitMQ();

    await canal.assertQueue(COLA_ASIGNACION, { durable: false });
    console.log(`Cola "${COLA_ASIGNACION}" declarada`);

    await canal.bindQueue(COLA_ASIGNACION, EXCHANGE, ROUTING_KEY_ENTRADA);
    console.log(`Cola "${COLA_ASIGNACION}" vinculada a "${EXCHANGE}" con "${ROUTING_KEY_ENTRADA}"`);

    console.log('Assignment worker esperando eventos...');

    await canal.consume(COLA_ASIGNACION, async (mensaje) => {
      if (mensaje === null) return;

      try {
        const eventoCreado = JSON.parse(mensaje.content.toString());
        console.log(`[assignment-worker] Recibido: ${eventoCreado.type} - ${eventoCreado.payload.ticketId}`);

        console.log(`Asignado a: ${RESPONSABLE}`);

        const eventoSiguiente = crearEvento('ticket.assigned', {
          ...eventoCreado.payload,
          responsable: RESPONSABLE
        });

        publicarEvento(canal, eventoSiguiente, ROUTING_KEY_SALIDA);

        canal.ack(mensaje);
        console.log(`[assignment-worker] Procesado y confirmado: ${eventoCreado.payload.ticketId}`);
      } catch (error) {
        console.error('[assignment-worker] Error al procesar mensaje:', error.message);
        // No se hace ack para posible reintento
      }
    });

    console.log('Assignment worker activo (Ctrl+C para salir)');
  } catch (error) {
    console.error('Error al iniciar assignment worker:', error.message);
    process.exit(1);
  }
})();

process.on('SIGINT', async () => {
  console.log('Cerrando assignment worker...');
  process.exit(0);
});