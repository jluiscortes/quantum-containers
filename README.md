# Quantum Containers – Reto Técnico MGI Schrodinger

Este proyecto resuelve el reto de gestión de contenedores usando arquitectura hexagonal y limpia con despliegue en AWS Fargate y alternativa en Lambda (Serverless).

---

## 🚀 Despliegue en AWS Fargate (orden correcto)

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

---

### 2. Construir imagen Docker

```bash
npm install
npm run build
docker build -t quantum-containers .
```

---

### 3. Subir imagen a Amazon ECR

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account_id>.dkr.ecr.us-east-1.amazonaws.com
docker tag quantum-containers:latest <account_id>.dkr.ecr.us-east-1.amazonaws.com/quantum-containers:latest
docker push <account_id>.dkr.ecr.us-east-1.amazonaws.com/quantum-containers:latest
```

---

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

---

### 5. Crear servicio y actualizar despliegue

```bash
aws ecs create-service   --cluster quantum-cluster   --service-name quantum-service   --task-definition quantum-task   --desired-count 1   --launch-type FARGATE   --network-configuration "awsvpcConfiguration={subnets=[subnet-abc],securityGroups=[sg-abc],assignPublicIp=ENABLED}"
```

Para actualizar con nueva imagen:

```bash
aws ecs update-service --cluster quantum-cluster --service quantum-service --force-new-deployment
```

---

### 6. Obtener IP pública del contenedor

```bash
aws ecs list-tasks --cluster quantum-cluster --service-name quantum-service --desired-status RUNNING
aws ecs describe-tasks --cluster quantum-cluster --tasks <taskArn>
aws ec2 describe-network-interfaces --network-interface-ids <eni-id> --query "NetworkInterfaces[0].Association.PublicIp" --output text
```

---

## ✅ Swagger

Una vez desplegado, accede a la documentación en:

```
http://<public-ip>:3000/api-docs
```

---

## ✅ Uso local

```bash
npm install
npm run start:dev
```

---

## ✅ Pruebas

```bash
npm run test
```

---

## ✅ Despliegue alternativo (Lambda + Serverless)

```bash
npx serverless deploy --stage dev
```

> Ver archivo `serverless.ts` para configuración detallada.

---
---

## ✅ Endpoints disponibles

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

**Respuesta**:
```json
{
  "message": "Evento registrado correctamente"
}
```

---

### 2. GET `/containers/:id/status`

**Descripción**: Consulta el estado verificado (por quorum) de un contenedor específico.

**Ejemplo**:
```
GET /containers/C-001/status
```

**Respuesta exitosa**:
```json
{
  "id": "C-001",
  "estado": "operational"
}
```

**Respuesta si no hay quorum o eventos**:
```json
{
  "success": false,
  "message": "No se encontraron eventos para el contenedor C-001",
  "data": null,
  "errorCode": "CONTAINER_NOT_FOUND",
  "statusCode": 404,
  "timestamp": "2025-05-17T12:00:00Z",
  "path": "/containers/C-001/status"
}
```

---

### 3. GET `/containers`

**Descripción**: Lista los contenedores con estado verificado (aquellos que alcanzan quorum).

**Respuesta**:
```json
[
  {
    "containerId": "C-001",
    "estado": "operational"
  },
  {
    "containerId": "C-002",
    "estado": "damaged"
  }
]
```