FROM node:20.13.0-slim AS development

# Evita prompts interactivos
ENV DEBIAN_FRONTEND=noninteractive

# Crear directorio de trabajo
WORKDIR /usr/src/app

# Copiar archivos necesarios primero (para cache de dependencias)
COPY package*.json ./

# Instalar dependencias de sistema para Puppeteer/Chromium
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libgbm1 \
    libgtk-3-0 \
    --no-install-recommends \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Node.js
RUN npm install \
 && npm install -g npm@10.8.1 \
 && npm install -g typescript \
 && npm install -g ts-node-dev

# Copiar el resto del proyecto
COPY tsconfig.json ./
COPY . .

# Compilar el proyecto
RUN npm run build

# Exponer el puerto si es necesario
EXPOSE 3000

# Iniciar la aplicación
CMD ["npm", "run", "start"]
