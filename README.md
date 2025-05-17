# Quantum Containers – Reto Técnico MGI Schrodinger

Este proyecto resuelve el reto de gestión de contenedores usando arquitectura hexagonal y limpia con despliegue en AWS Fargate y alternativa en Lambda (Serverless).

---

## Lógica Funcional del Sistema

El sistema Quantum Containers implementa una arquitectura de verificación por quorum para garantizar la integridad en el seguimiento de estado de contenedores marítimos:

### 1. Registro de Eventos

Cuando un evento llega al sistema:

- Se valida el formato y campos requeridos
- Se persiste en la base de datos MongoDB
- Se evalúa si el estado es "damaged"
- En caso de estado dañado, se genera una alerta vía Amazon SNS y se registra log en s3
- La alerta incluye el ID del contenedor y su estado reportado

### 2. Verificación por Quorum

Para determinar el estado oficial de un contenedor:

- Se obtienen todos los eventos relacionados con el contenedor
- El sistema requiere al menos 3 eventos registrados para alcanzar quorum
- Si no hay suficientes eventos, se considera estado indeterminado
- Se evalúa la mayoría simple entre los estados reportados
- En caso de empate, se prioriza el estado "damaged" por motivos de seguridad

### 3. Notificación de Contenedores Dañados

Cuando un contenedor se marca como dañado:

- El sistema genera automáticamente una notificación en Amazon SNS
- Se registra un log detallado en S3 para auditoría posterior
- El mensaje incluye detalles del contenedor y registro de eventos
- Las notificaciones pueden ser consumidas por otros sistemas para tomar acciones correctivas

### 4. Persistencia y Respaldo

El sistema implementa mecanismos de persistencia resilientes:

- Todos los eventos se almacenan en MongoDB con índices optimizados
- Los registros de error se almacenan en Amazon S3 con retención configurable
- Se garantiza trazabilidad completa del historial de cada contenedor
- Los índices de MongoDB permiten consultas eficientes por containerId, estado y fecha

---

## 🚀 Despliegue en AWS Fargate

### 1. Crear política de confianza y rol IAM

Guarda esto como `trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

```bash
aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document file://trust-policy.json
aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
```

### 2. Construir imagen Docker

```bash
npm install
npm run build
docker build -t quantum-containers .
```

### 3. Subir imagen a Amazon ECR

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account_id>.dkr.ecr.us-east-1.amazonaws.com
docker tag quantum-containers:latest <account_id>.dkr.ecr.us-east-1.amazonaws.com/quantum-containers:latest
docker push <account_id>.dkr.ecr.us-east-1.amazonaws.com/quantum-containers:latest
```

### 4. Crear definición de tarea

Guarda esto como `task-def.json`:

```json
{
  "family": "quantum-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::<account_id>:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "quantum-container",
      "image": "<account_id>.dkr.ecr.us-east-1.amazonaws.com/quantum-containers:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "essential": true
    }
  ]
}
```

```bash
aws ecs register-task-definition --cli-input-json file://task-def.json
```

### 5. Crear servicio y actualizar despliegue

```bash
aws ecs create-service   --cluster quantum-cluster   --service-name quantum-service   --task-definition quantum-task   --desired-count 1   --launch-type FARGATE   --network-configuration "awsvpcConfiguration={subnets=[subnet-abc],securityGroups=[sg-abc],assignPublicIp=ENABLED}"
```

Para actualizar con nueva imagen:

```bash
aws ecs update-service --cluster quantum-cluster --service quantum-service --force-new-deployment
```

### 6. Obtener IP pública del contenedor

```bash
aws ecs list-tasks --cluster quantum-cluster --service-name quantum-service --desired-status RUNNING
aws ecs describe-tasks --cluster quantum-cluster --tasks <taskArn>
aws ec2 describe-network-interfaces --network-interface-ids <eni-id> --query "NetworkInterfaces[0].Association.PublicIp" --output text
```

---

## Swagger

Una vez desplegado, accede a la documentación en:

```
http://<public-ip>:3000/api-docs
```

Local

```
http://localhost:3000/api-docs
```

---

## Uso local

```bash
npm install
npm run start:dev
```

## Pruebas

```bash
npm run test
```

## Coverage

```bash
npm run test:cov
```

---

## Despliegue alternativo (Lambda + Serverless)

```bash
npx serverless deploy --stage dev
```

> Ver archivo `serverless.ts` para configuración detallada.

---

## Endpoints disponibles

### 1. POST `/containers/events`

**Descripción**: Registra un nuevo evento de cambio de estado de un contenedor.

**Payload JSON**:
```json
{
  "containerId": "C-001",
  "state": "running",
  "timestamp": "2025-05-17T12:00:00Z",
  "source": "sensor-1"
}
```
**Respuesta Exitosa**:
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {
    "message": "Evento registrado correctamente"
  },
  "errorCode": null,
  "statusCode": 200,
  "timestamp": "2025-05-17T14:08:58.923Z",
  "path": "/containers/events"
}
```

**Respuesta Error**:
```json
{
  "success": false,
  "message": "Ocurrió un error inesperado",
  "data": null,
  "errorCode": "UNEXPECTED_ERROR",
  "statusCode": 500,
  "timestamp": "2025-05-17T14:09:09.550Z",
  "path": "/containers/events"
}
```

---

### 2. GET `/containers/:id/status`

**Descripción**: Consulta el estado verificado (por quorum) de un contenedor específico.

**Ejemplo**:
```
GET /containers/C-005/status
```

**Respuesta exitosa**:
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {
    "id": "C-005",
    "estado": "operational"
  },
  "errorCode": null,
  "statusCode": 200,
  "timestamp": "2025-05-17T14:06:11.412Z",
  "path": "/containers/C-005/status"
}
```
**Respuesta si no hay quorum o eventos**:
```json
{
  "success": false,
  "message": "No se encontraron eventos para el contenedor C-008",
  "data": null,
  "errorCode": "CONTAINER_NOT_FOUND",
  "statusCode": 404,
  "timestamp": "2025-05-17T14:08:26.663Z",
  "path": "/containers/C-008/status"
}
```

---

### 3. GET `/containers`

**Descripción**: Lista los contenedores con estado verificado (aquellos que alcanzan quorum).

**Respuesta**:
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": [
    {
      "id": "C-001",
      "state": "damaged"
    },
    {
      "id": "C-005",
      "state": "operational"
    }
  ],
  "errorCode": null,
  "statusCode": 200,
  "timestamp": "2025-05-17T14:08:42.107Z",
  "path": "/containers"
}
```