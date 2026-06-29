// shared/publicador.js
// Publica un evento en el exchange de RabbitMQ

const EXCHANGE = 'helpdesk.events';

/**
 * Publica un evento en el exchange usando la routing key indicada.
 * @param {import('amqplib').Channel} canal - Canal activo de RabbitMQ
 * @param {object} evento - Evento a publicar
 * @param {string} routingKey - Routing key para el mensaje
 */
function publicarEvento(canal, evento, routingKey) {
  const mensaje = Buffer.from(JSON.stringify(evento));
  canal.publish(EXCHANGE, routingKey, mensaje);
  console.log(`Evento publicado - routing key: "${routingKey}" - eventId: ${evento.eventId}`);
}

module.exports = publicarEvento;