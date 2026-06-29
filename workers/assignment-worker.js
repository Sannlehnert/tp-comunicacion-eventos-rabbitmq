// workers/assignment-worker.js
// Consume eventos ticket.created, asigna un responsable y publica ticket.assigned

const conectarRabbitMQ = require('../shared/conexionRabbit');
const { crearEvento } = require('../shared/eventos');
const publicarEvento = require('../shared/publicador');

const COLA_ASIGNACION = 'helpdesk.assignment';
const EXCHANGE = 'helpdesk.events';
const ROUTING_KEY_ENTRADA = 'ticket.created';
const ROUTING_KEY_SALIDA = 'ticket.assigned';

// Responsable fijo para la simulación
const RESPONSABLE = 'Juan Perez';

(async () => {
  try {
    // 1. Conectar a RabbitMQ
    const { conexion, canal } = await conectarRabbitMQ();

    // 2. Declarar la cola de asignación
    await canal.assertQueue(COLA_ASIGNACION, { durable: false });
    console.log(`Cola "${COLA_ASIGNACION}" declarada`);

    // 3. Vincular la cola al exchange con la routing key de entrada
    await canal.bindQueue(COLA_ASIGNACION, EXCHANGE, ROUTING_KEY_ENTRADA);
    console.log(`Cola "${COLA_ASIGNACION}" vinculada a "${EXCHANGE}" con "${ROUTING_KEY_ENTRADA}"`);

    // 4. Consumir mensajes
    console.log('Assignment worker esperando eventos...');
    await canal.consume(COLA_ASIGNACION, async (mensaje) => {
      if (mensaje === null) return;

      try {
        // Convertir el contenido a objeto
        const eventoCreado = JSON.parse(mensaje.content.toString());
        console.log(`[assignment-worker] Recibido: ${eventoCreado.type} - ${eventoCreado.payload.ticketId}`);

        // Simular asignación
        console.log(`Asignado a: ${RESPONSABLE}`);

        // Crear el nuevo evento ticket.assigned
        const eventoSiguiente = crearEvento('ticket.assigned', {
          ...eventoCreado.payload,       // copiamos los datos originales
          responsable: RESPONSABLE       // agregamos el responsable
        });

        // Publicar el nuevo evento
        publicarEvento(canal, eventoSiguiente, ROUTING_KEY_SALIDA);

        // Confirmar el mensaje original
        canal.ack(mensaje);
        console.log(`[assignment-worker] Procesado y confirmado: ${eventoCreado.payload.ticketId}`);
      } catch (error) {
        console.error('[assignment-worker] Error al procesar mensaje:', error.message);
        // Si hay error, no hacemos ack para que el mensaje se pueda reprocesar
        // (en un sistema real iría a una cola de errores, pero aún no lo implementamos)
      }
    });

    // Mantener el worker corriendo (no cerrar)
    console.log('Assignment worker activo (Ctrl+C para salir)');
  } catch (error) {
    console.error('Error al iniciar assignment worker:', error.message);
    process.exit(1);
  }
})();

// Cierre ordenado
process.on('SIGINT', async () => {
  console.log('Cerrando assignment worker...');
  process.exit(0);
});