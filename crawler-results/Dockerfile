# Frontend React
FROM node:16 AS react-build

# Define diretório do React
WORKDIR /app/frontend

# Copia os arquivos do front
COPY package.json .
COPY package-lock.json .
RUN npm install

COPY . ./

# Constrói o front React
RUN npm run build