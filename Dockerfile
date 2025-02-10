# Frontend React
FROM node:16 AS react-build

# Define diretório do React
WORKDIR /app/frontend

# Copia os arquivos do front
COPY frontend/package.json fronted/package-lock.json ./
RUN npm install

COPY frontend/ ./

# Constrói o front React
RUN npm run build

# Usa uma imagem base do Python para o Flask
FROM python:3.9-slim AS flask-app

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de requisitos do Python
COPY requirements.txt .

# Instalando Numpy primeiro
RUN pip install --no-cache-dir numpy==1.23.5

# Instala as dependências do Python
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código do Flask para o container
COPY app.py .
COPY trained_model ./trained_model

# Instala o modelo de linguagem do Spacy (português)
RUN python -m spacy download pt_core_news_lg

# Expõe a porta 5000 (porta padrão do Flask)
EXPOSE 5000

# Comando para rodar o Flask
CMD ["python", "app.py"]

# Fim da parte do Flask

# Início da parte do Node.js (crawler)
FROM node:16 AS node-app

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos do Node.js
COPY novo_crawler_teste.js .
COPY package.json .
COPY package-lock.json .

# Instala as dependências do sistema necessárias para o Playwright
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libatspi2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Instala as dependências do Node.js
RUN npm install

# Instala o Playwright e seus navegadores
RUN npx playwright install

# Comando para rodar o crawler (opcional, pode ser rodado manualmente)
CMD ["node", "novo_crawler_teste.js"]