# 🐳 Docker Setup - KnightBot MD

Este guia mostra como executar o KnightBot MD em um container Docker.

## 📋 Pré-requisitos

- Docker Engine 20.10+
- Docker Compose 2.0+
- Pelo menos 512MB de RAM disponível

## 🚀 Execução Rápida

### 1. Build e Execução com Docker Compose

```bash
# Build da imagem
docker compose build

# Executar o bot
docker compose up -d

# Ver logs
docker compose logs -f knightbot

# Parar o bot
docker compose down
```

### 2. Execução Manual com Docker

```bash
# Build da imagem
docker build -t knightbot-md .

# Executar o container
docker run -d \
  --name knightbot-md \
  --restart unless-stopped \
  -v $(pwd)/session:/app/session \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/tmp:/app/tmp \
  -e NODE_ENV=production \
  knightbot-md
```

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
NODE_ENV=production
TZ=America/Sao_Paulo
SESSION_ID=your_session_id
BOT_TOKEN=your_bot_token
# Adicione outras variáveis conforme necessário
```

### Volumes Persistentes

O Docker Compose monta os seguintes volumes:

- `./session:/app/session` - Dados da sessão do WhatsApp
- `./logs:/app/logs` - Logs da aplicação
- `./tmp:/app/tmp` - Arquivos temporários

## 🔧 Comandos Úteis

### Gerenciamento do Container

```bash
# Ver status
docker-compose ps

# Reiniciar o bot
docker-compose restart

# Atualizar e reiniciar
docker-compose down && docker-compose up -d --build

# Acessar o container
docker-compose exec knightbot sh

# Ver logs em tempo real
docker-compose logs -f knightbot
```

### Debugging

```bash
# Executar em modo interativo
docker-compose run --rm knightbot sh

# Ver logs detalhados
docker-compose logs --tail=100 knightbot

# Verificar recursos utilizados
docker stats knightbot-md
```

## 🏗️ Build Otimizado

### Multi-stage Build (Opcional)

Para uma imagem ainda menor, você pode usar um Dockerfile multi-stage:

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:18-alpine
RUN apk add --no-cache ffmpeg python3 make g++
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
CMD ["npm", "start"]
```

## 📊 Monitoramento

### Health Check

O container inclui um health check que verifica se o bot está funcionando:

```bash
# Verificar status de saúde
docker inspect knightbot-md | grep -A 10 "Health"
```

### Logs Estruturados

```bash
# Filtrar logs por nível
docker-compose logs knightbot | grep ERROR
docker-compose logs knightbot | grep WARN
```

## 🔒 Segurança

### Executar como usuário não-root

```dockerfile
# Adicionar ao Dockerfile
RUN addgroup -g 1001 -S nodejs
RUN adduser -S knightbot -u 1001
USER knightbot
```

### Limitar recursos

```yaml
# No docker-compose.yml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **FFmpeg não encontrado**
   ```bash
   # Verificar se FFmpeg está instalado
   docker-compose exec knightbot ffmpeg -version
   ```

2. **Permissões de volume**
   ```bash
   # Corrigir permissões
   sudo chown -R 1001:1001 session logs tmp
   ```

3. **Container não inicia**
   ```bash
   # Ver logs detalhados
   docker-compose logs knightbot
   ```

### Reset Completo

```bash
# Parar e remover tudo
docker-compose down -v
docker system prune -f

# Rebuild completo
docker-compose build --no-cache
docker-compose up -d
```

## 📈 Performance

### Otimizações Recomendadas

1. **Usar volumes nomeados para produção**
2. **Configurar log rotation**
3. **Monitorar uso de recursos**
4. **Usar imagem Alpine para menor tamanho**

### Exemplo de Produção

```yaml
version: '3.8'
services:
  knightbot:
    build: .
    restart: always
    volumes:
      - session-data:/app/session
      - logs-data:/app/logs
    environment:
      - NODE_ENV=production
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'

volumes:
  session-data:
  logs-data:
```

## 🎯 Próximos Passos

1. Configure suas variáveis de ambiente
2. Execute o build: `docker-compose build`
3. Inicie o bot: `docker-compose up -d`
4. Monitore os logs: `docker-compose logs -f`
5. Configure backup dos volumes se necessário

---

**Nota**: Certifique-se de que o arquivo `.env` não seja commitado no Git por questões de segurança.
