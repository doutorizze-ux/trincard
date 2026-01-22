# Estágio 1: Build da Aplicação
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm install

# Copiar código fonte
COPY . .

# Build do Frontend (Vite)
RUN npm run build

# Estágio 2: Runner (Backend + Frontend estático)
FROM node:20-alpine

WORKDIR /app

# Copiar arquivos necessários do build anterior
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/api ./api
COPY --from=builder /app/database ./database

# Variáveis de ambiente padrão
ENV PORT=3000
ENV NODE_ENV=production

# Expor porta
EXPOSE 3000

# Comando para iniciar
CMD ["npm", "start"]
