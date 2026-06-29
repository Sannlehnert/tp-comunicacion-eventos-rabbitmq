# Parte A - Conceptual

## 1. Diferencia entre una llamada REST y un evento publicado en un broker

Una llamada REST es síncrona: el cliente hace una solicitud HTTP y espera una respuesta inmediata del servidor. El cliente sabe exactamente quién procesa su pedido y necesita que el servidor esté disponible en ese momento.

Un evento publicado en un broker es asíncrono: el productor emite un mensaje al broker y no espera respuesta. El productor no sabe quién va a consumir ese evento ni cuándo va a procesarlo. Incluso si ningún consumidor está activo en ese momento, el mensaje queda en una cola y se procesa cuando el consumidor esté disponible.

Esto permite desacoplar servicios: el productor y el consumidor no se conocen entre sí, solo conocen al broker.

## 2. Definiciones

- **Producer (productor)**: es la aplicación que crea y envía mensajes al broker. En este TP, la API (`api-service`) actúa como productora cuando publica eventos `ticket.created`.

- **Broker**: es el intermediario que recibe mensajes de los productores y los entrega a los consumidores. En este TP usamos RabbitMQ, que se encarga de enrutar y almacenar temporalmente los mensajes.

- **Exchange**: es el punto de entrada al broker donde los productores publican mensajes. El exchange recibe los mensajes y decide a qué cola(s) enviarlos según el tipo y las reglas de enrutamiento. En este TP usamos un exchange de tipo `topic` llamado `helpdesk.events`.

- **Queue (cola)**: es donde se almacenan los mensajes hasta que un consumidor los procesa. Cada cola tiene un nombre y los consumidores leen de ellas. En este TP tenemos `helpdesk.assignment`, `helpdesk.audit` y `helpdesk.errores`.

- **Routing key**: es una etiqueta que el productor asigna a cada mensaje y que el exchange usa para decidir a qué cola(s) enviarlo. Por ejemplo, `ticket.created.high` o `ticket.assigned`.

- **Consumer (consumidor)**: es la aplicación que lee mensajes de una cola y los procesa. En este TP, `assignment-worker` y `audit-worker` son consumidores.

## 3. Por qué un evento debe representar algo que ya ocurrió y no una orden directa

Un evento debe ser la notificación de un hecho que ya sucedió porque así se mantiene el desacoplamiento entre servicios.

Si un mensaje fuera una orden (por ejemplo, "asigná este ticket"), el productor estaría diciéndole al consumidor lo que tiene que hacer. Eso genera dependencia: el productor necesita saber qué hace el consumidor y cómo debe hacerlo.

En cambio, si el productor publica un hecho ("el ticket TCK-001 fue creado"), no le está dando instrucciones a nadie. Es el consumidor quien decide qué hacer con esa información: puede asignarlo, enviarlo por mail, guardarlo en una base de datos, etc. El productor no necesita saberlo.

Esto permite agregar nuevos consumidores en el futuro sin modificar el productor, porque solo reaccionan a hechos que ya están definidos.