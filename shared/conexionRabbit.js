const amqp = require('amqplib');

const URL_RABBIT = 'amqp://guest:guest@localhost:5672';
const EXCHANGE = 'helpdesk.events';

/**
 * Establece la conexión, crea un canal y asegura que el exchange topic exista.
 * @returns {Promise<{connection: amqp.Connection, canal: amqp.Channel}>}
 */
async function conectarRabbitMQ() {
  console.log('Intentando conectar a RabbitMQ...');

  // 1. Conectar al broker
  const conexion = await amqp.connect(URL_RABBIT);
  console.log('Conexión establecida con RabbitMQ');

  // 2. Crear un canal (todas las operaciones se hacen sobre él)
  const canal = await conexion.createChannel();
  console.log('Canal creado');

  // 3. Declarar (asegurar) el exchange
  await canal.assertExchange(EXCHANGE, 'topic', {
    durable: false   // para desarrollo no necesitamos persistencia en disco
  });
  console.log(`Exchange "${EXCHANGE}" listo (tipo topic)`);

  return { conexion, canal };
}

module.exports = conectarRabbitMQ;