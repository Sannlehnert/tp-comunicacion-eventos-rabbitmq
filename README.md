# TP Comunicación por Eventos

Trabajo práctico de la materia **Integración de Aplicaciones** correspondiente a la carrera **Desarrollo de Software Full Stack**.

## Descripción

Este proyecto implementa un sistema sencillo de mesa de ayuda utilizando una arquitectura orientada a eventos.

La aplicación permite crear tickets mediante una API REST y utiliza RabbitMQ como broker de mensajes para distribuir los eventos entre distintos consumidores.

El objetivo principal es demostrar el funcionamiento de la comunicación asincrónica mediante eventos, utilizando exchanges, colas, routing keys y workers.

---

# Tecnologías utilizadas

- Node.js
- Express
- RabbitMQ
- Docker Compose
- amqplib
- uuid

---

# Requisitos

Antes de ejecutar el proyecto es necesario tener instalado:

- Node.js
- Docker Desktop
- Git

---

# Instalación

Clonar el repositorio:

```bash
git clone <URL_DEL_REPOSITORIO>
```

Ingresar al proyecto:

```bash
cd tp-comunicacion-eventos
```

Instalar las dependencias:

```bash
npm install
```

---

# Levantar RabbitMQ

Desde la carpeta del proyecto ejecutar:

```bash
docker compose up -d
```

RabbitMQ quedará disponible en:

Management:

```
http://localhost:15672
```

Usuario:

```
guest
```

Contraseña:

```
guest
```

---

# Ejecutar la aplicación

Abrir cuatro terminales.

## API

```bash
npm run api
```

## Assignment Worker

```bash
npm run worker:assign
```

## Audit Worker

```bash
npm run worker:audit
```

RabbitMQ debe permanecer ejecutándose durante toda la prueba.

---

# Estructura del proyecto

```
tp-comunicacion-eventos/
│
├── api-service/
│   └── index.js
│
├── workers/
│   ├── assignment-worker.js
│   └── audit-worker.js
│
├── shared/
│   ├── conexionRabbit.js
│   ├── eventos.js
│   ├── publicador.js
│   └── archivos.js
│
├── data/
│   ├── audit.log
│   ├── metrics.json
│   └── processed-events.json
│
├── docker-compose.yml
├── package.json
├── README.md
└── respuestas.md
```

---

# Funcionamiento

La API recibe solicitudes mediante el endpoint `POST /tickets`.

Cuando se crea un ticket:

1. Se valida la información recibida.
2. Se genera un evento `ticket.created`.
3. El evento se publica en RabbitMQ.
4. Se actualiza la métrica diaria.
5. El Assignment Worker consume el evento.
6. Si la prioridad es válida (`high`, `normal` o `low`), asigna un responsable y publica un nuevo evento `ticket.assigned`.
7. Si la prioridad es `critical`, el evento se envía a la cola `helpdesk.errores`.
8. El Audit Worker registra todos los eventos recibidos en `audit.log`.

---

# Endpoint disponible

## Crear ticket

**POST**

```
http://localhost:3000/tickets
```

### Body

```json
{
  "title": "Error en login",
  "description": "No se puede iniciar sesión",
  "priority": "high"
}
```

Las prioridades aceptadas son:

- high
- normal
- low
- critical

---

# Ejemplo de respuesta

```json
{
  "eventId": "0fbd98d2-0d89-4b36-ae64-89f4b5b50d67",
  "type": "ticket.created",
  "occurredAt": "2026-06-29T20:35:10.152Z",
  "version": 1,
  "payload": {
    "ticketId": "TCK-001",
    "title": "Error en login",
    "description": "No se puede iniciar sesión",
    "priority": "high"
  }
}
```

---

# Archivos generados

## audit.log

Contiene un registro de todos los eventos procesados por el sistema.

Cada línea representa un evento en formato JSON.

---

## metrics.json

Guarda la cantidad de tickets creados por día.

Ejemplo:

```json
{
  "2026-06-29": 5
}
```

---

## processed-events.json

Almacena los identificadores (`eventId`) de los eventos ya procesados para evitar procesarlos más de una vez.

Ejemplo:

```json
[
  "4b46c12f-1c6e-4f8d-97af-f25c2d5fd1a3",
  "f31b6a48-b69f-49b5-b03c-64d64b6d8904"
]
```

---

# Funcionalidades implementadas

- API REST con Express.
- Publicación de eventos en RabbitMQ.
- Exchange de tipo `topic`.
- Routing por prioridad.
- Assignment Worker.
- Audit Worker.
- Confirmación manual de mensajes (`ack`).
- Registro de auditoría.
- Métricas diarias.
- Idempotencia mediante `processed-events.json`.
- Manejo especial para tickets con prioridad `critical`.

---

# Flujo del sistema

```
Cliente
   │
   ▼
POST /tickets
   │
   ▼
API REST
   │
   ▼
RabbitMQ
   │
   ├──────────────► Assignment Worker
   │                     │
   │                     ├── prioridad normal
   │                     │       │
   │                     │       ▼
   │                     │  ticket.assigned
   │                     │
   │                     └── prioridad critical
   │                             │
   │                             ▼
   │                     helpdesk.errores
   │
   ▼
Audit Worker
   │
   ▼
audit.log
```

---

# Conclusión

Este trabajo permitió implementar una arquitectura orientada a eventos utilizando RabbitMQ como broker de mensajes.

Durante el desarrollo se aplicaron conceptos como productores, consumidores, exchanges, colas, routing keys, comunicación asincrónica, confirmación de mensajes, métricas e idempotencia, integrando todos los componentes en un sistema funcional.