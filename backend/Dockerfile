# Imagen de producción del backend de VidaEnRed
FROM node:22-alpine

WORKDIR /app

# Dependencias primero para aprovechar la caché de Docker
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

# Aplica el esquema (idempotente) y luego arranca la API
CMD ["npm", "run", "start:produccion"]
