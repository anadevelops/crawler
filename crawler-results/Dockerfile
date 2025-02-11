# Frontend React
FROM node:16 AS react-build

# Define diretório do React
WORKDIR /app/frontend

# Copia os arquivos do front
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

COPY frontend/ ./

# Constrói o front React
RUN npm run build