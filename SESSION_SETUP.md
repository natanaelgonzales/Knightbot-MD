# 📱 Sessão WhatsApp - Sereia Bot

Este guia explica como criar uma sessão válida do WhatsApp para o Sereia Bot antes de executá-lo em produção.

## 🚀 Método 1: Script Automatizado (Recomendado)

### 1. Execute o script de setup:
```bash
./setup-session.sh
```

### 2. Siga as instruções:
- O script irá construir a imagem Docker
- Iniciará o container em modo interativo
- Você verá um QR code nos logs
- Escaneie o QR code com seu WhatsApp
- Aguarde a criação da sessão

### 3. Execute o bot normalmente:
```bash
docker-compose up -d
```

## 🔧 Método 2: Manual

### 1. Construa a imagem:
```bash
docker-compose build
```

### 2. Execute em modo interativo:
```bash
docker-compose run --rm sereia-bot npm start
```

### 3. Escaneie o QR code:
- Abra o WhatsApp no seu celular
- Vá em "Dispositivos conectados"
- Toque em "Conectar um dispositivo"
- Escaneie o QR code que aparece nos logs

### 4. Aguarde a criação da sessão:
- O bot irá criar os arquivos de sessão
- Você verá uma mensagem de sucesso
- Pare o container (Ctrl+C)

### 5. Execute em produção:
```bash
docker-compose up -d
```

## 🛠️ Método 3: Desenvolvimento

### 1. Use o compose de desenvolvimento:
```bash
docker-compose -f docker-compose.dev.yml up
```

### 2. Vantagens do modo dev:
- Não reinicia automaticamente
- Volumes montados para desenvolvimento
- Logs mais detalhados

## 📁 Estrutura de Arquivos

Após criar a sessão, você terá:

```
session/
├── session-1234567890/
│   ├── creds.json
│   ├── keys.json
│   └── ...
```

## ⚠️ Importante

### Segurança:
- **NUNCA** compartilhe os arquivos da pasta `session/`
- **NUNCA** faça commit dos arquivos de sessão
- Mantenha backup seguro dos arquivos de sessão

### Troubleshooting:

#### QR Code não aparece:
```bash
# Verifique os logs
docker-compose logs sereia-bot

# Reinicie o container
docker-compose restart sereia-bot
```

#### Sessão expirada:
```bash
# Remova a sessão antiga
rm -rf session/

# Execute o setup novamente
./setup-session.sh
```

#### Container não inicia:
```bash
# Verifique se a sessão existe
ls -la session/

# Verifique permissões
sudo chown -R $USER:$USER session/
```

## 🔄 Comandos Úteis

### Ver logs em tempo real:
```bash
docker-compose logs -f sereia-bot
```

### Parar o bot:
```bash
docker-compose down
```

### Reiniciar o bot:
```bash
docker-compose restart
```

### Acessar o container:
```bash
docker-compose exec sereia-bot sh
```

### Backup da sessão:
```bash
tar -czf session-backup-$(date +%Y%m%d).tar.gz session/
```

## 📱 Dicas para o WhatsApp

1. **Mantenha o celular conectado** durante a criação da sessão
2. **Use a mesma conta** que você quer conectar ao bot
3. **Não desconecte** o dispositivo após escanear
4. **Mantenha o WhatsApp ativo** no celular

## 🎯 Próximos Passos

Após criar a sessão:

1. ✅ Teste o bot com comandos básicos
2. ✅ Configure comandos de admin
3. ✅ Teste em grupos
4. ✅ Configure backup automático
5. ✅ Monitore logs e performance

---

**Nota**: Se você tiver problemas, verifique se o Docker está rodando e se você tem permissões adequadas nos diretórios.
