const { v4: uuidv4 } = require('uuid');

/**
 * Crea un objeto evento estándar.
 * @param {string} tipo - Ej: 'ticket.created'
 * @param {object} datosTicket - { ticketId, title, description, priority }
 * @returns {object} evento
 */
function crearEvento(tipo, datosTicket) {
  return {
    eventId: uuidv4(),
    type: tipo,
    occurredAt: new Date().toISOString(),
    version: 1,
    payload: {
      ticketId: datosTicket.ticketId,
      title: datosTicket.title,
      description: datosTicket.description || '',
      priority: datosTicket.priority
    }
  };
}

module.exports = { crearEvento };