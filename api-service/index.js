const express = require('express');
const conectarRabbitMQ = require('../shared/conexionRabbit');
const { crearEvento } = require('../shared/eventos');
const publicarEvento = require('../shared/publicador');

const app = express();
app.use(express.json());

// Variables globales para la conexión y el canal (se inicializan al arrancar)
let conexion = null;
let canal = null;

// Contador simple para generar ticketId (solo para desarrollo, se reinicia al reiniciar API)
let contadorTickets = 1;

/**
 * POST /tickets
 * Recibe title, description y priority. Crea y publica el evento ticket.created.
 */
app.post('/tickets', async (req, res) => {
  try {
    const { title, description, priority } = req.body;

    // Validación mínima
    if (!title || !priority) {
      return res.status(400).json({ error: 'Los campos title y priority son obligatorios.' });
    }

    // Generar un ticketId simple (ej: TCK-001)
    const ticketId = `TCK-${String(contadorTickets++).padStart(3, '0')}`;

    // 1. Crear el evento
    const evento = crearEvento('ticket.created', {
      ticketId,
      title,
      description: description || '',
      priority
    });

    // 2. Publicarlo en el exchange
    publicarEvento(canal, evento, 'ticket.created');

    // 3. Responder al cliente
    console.log(`Ticket creado: ${ticketId} - ${title}`);
    res.status(201).json(evento);
  } catch (error) {
    console.error('Error al procesar el ticket:', error.message);
    res.status(500).json({ error: 'Error interno al crear el ticket.' });
  }
});

// Iniciar el servidor
(async () => {
  try {
    // Conectar a RabbitMQ
    const resultado = await conectarRabbitMQ();
    conexion = resultado.conexion;
    canal = resultado.canal;

    // Levantar Express
    const PUERTO = 3000;
    app.listen(PUERTO, () => {
      console.log(`API escuchando en http://localhost:${PUERTO}`);
      console.log('Endpoint POST /tickets listo para recibir solicitudes');
    });
  } catch (error) {
    console.error('No se pudo iniciar la API:', error.message);
    process.exit(1);
  }
})();

// Cierre ordenado al detener la aplicación (Ctrl+C)
process.on('SIGINT', async () => {
  console.log('Cerrando servidor...');
  if (canal) await canal.close();
  if (conexion) await conexion.close();
  process.exit(0);
});