# Etapa 1: Build en entorno aislado
FROM node:18-alpine AS builder

# Establecer usuario no root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Crear directorio de trabajo
WORKDIR /usr/src/app

# Copiar solo lo necesario para instalar dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci

# Copiar el resto del código (incluye .env)
COPY . .

# Construir el proyecto NestJS (creará /dist)
RUN npm run build

# Etapa 2: Contenedor de runtime seguro
FROM node:18-alpine

# Seguridad: crear usuario sin privilegios
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Directorio de trabajo
WORKDIR /usr/src/app

# Copiar artefactos desde el builder
COPY --chown=appuser:appgroup --from=builder /usr/src/app/dist ./dist
COPY --chown=appuser:appgroup --from=builder /usr/src/app/node_modules ./node_modules
COPY --chown=appuser:appgroup --from=builder /usr/src/app/package*.json ./
COPY --chown=appuser:appgroup --from=builder /usr/src/app/.env .env


# Seguridad: cambia a usuario no root
USER appuser

# Puerto expuesto por Nest (ajusta si usas otro)
EXPOSE 3000

# Comando de inicio
CMD ["node", "dist/src/main"]
