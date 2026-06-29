const conectarRabbitMQ = require('../shared/conexionRabbit');
const { crearEvento } = require('../shared/eventos');
const publicarEvento = require('../shared/publicador');
const { verificarYRegistrarEvento } = require('../shared/archivos');

const COLA_ASIGNACION = 'helpdesk.assignment';
const COLA_ERRORES = 'helpdesk.errores';
const EXCHANGE = 'helpdesk.events';
const ROUTING_KEY_ENTRADA = 'ticket.created.*';
const ROUTING_KEY_SALIDA = 'ticket.assigned';
const RESPONSABLE = 'Juan Perez';

(async () => {
  try {
    const { conexion, canal } = await conectarRabbitMQ();

    await canal.assertQueue(COLA_ASIGNACION, { durable: false });
    console.log(`Cola "${COLA_ASIGNACION}" declarada`);

    await canal.bindQueue(COLA_ASIGNACION, EXCHANGE, ROUTING_KEY_ENTRADA);
    console.log(`Cola "${COLA_ASIGNACION}" vinculada a "${EXCHANGE}" con "${ROUTING_KEY_ENTRADA}"`);

    await canal.assertQueue(COLA_ERRORES, { durable: false });
    console.log(`Cola "${COLA_ERRORES}" declarada`);

    console.log('Assignment worker esperando eventos...');

    await canal.consume(COLA_ASIGNACION, async (mensaje) => {
      if (mensaje === null) return;

      try {
        const eventoCreado = JSON.parse(mensaje.content.toString());
        const eventId = eventoCreado.eventId;

        const esNuevo = await verificarYRegistrarEvento(eventId);
        if (!esNuevo) {
          console.log(`Evento duplicado ignorado: ${eventId}`);
          canal.ack(mensaje);
          return;
        }

        if (eventoCreado.payload.priority === 'critical') {
          console.log(`Error: prioridad critical detectada - ticket ${eventoCreado.payload.ticketId}`);
          const mensajeError = Buffer.from(JSON.stringify(eventoCreado));
          canal.sendToQueue(COLA_ERRORES, mensajeError);
          console.log(`Mensaje enviado a cola "${COLA_ERRORES}"`);
          canal.ack(mensaje);
          return;
        }

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