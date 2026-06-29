const express = require('express');
const conectarRabbitMQ = require('../shared/conexionRabbit');
const { crearEvento } = require('../shared/eventos');
const publicarEvento = require('../shared/publicador');
const { incrementarContadorDiario } = require('../shared/archivos');

const app = express();
app.use(express.json());

let conexion = null;
let canal = null;
let contadorTickets = 1;

app.post('/tickets', async (req, res) => {
  try {
    const { title, description, priority } = req.body;

    if (!title || !priority) {
      return res.status(400).json({ error: 'Los campos title y priority son obligatorios.' });
    }

    const PRIORIDADES_VALIDAS = ['high', 'normal', 'low'];
    if (!PRIORIDADES_VALIDAS.includes(priority)) {
      return res.status(400).json({ error: 'La prioridad debe ser high, normal o low.' });
    }

    const ticketId = `TCK-${String(contadorTickets++).padStart(3, '0')}`;

    const evento = crearEvento('ticket.created', {
      ticketId,
      title,
      description: description || '',
      priority
    });

    const routingKey = `ticket.created.${priority}`;
    publicarEvento(canal, evento, routingKey);

    try {
      await incrementarContadorDiario();
    } catch (errorMetrica) {
      console.error('No se pudo actualizar metrics.json:', errorMetrica.message);
    }

    console.log(`Ticket creado: ${ticketId} - ${title} (prioridad: ${priority})`);
    res.status(201).json(evento);
  } catch (error) {
    console.error('Error al procesar el ticket:', error.message);
    res.status(500).json({ error: 'Error interno al crear el ticket.' });
  }
});

(async () => {
  try {
    const resultado = await conectarRabbitMQ();
    conexion = resultado.conexion;
    canal = resultado.canal;

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

process.on('SIGINT', async () => {
  console.log('Cerrando servidor...');
  if (canal) await canal.close();
  if (conexion) await conexion.close();
  process.exit(0);
});