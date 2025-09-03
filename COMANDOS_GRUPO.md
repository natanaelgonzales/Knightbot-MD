# 🧜‍♀️ Sereia Bot - Comandos de Grupo

Este documento descreve os comandos específicos para grupos do WhatsApp.

## 🔗 Comandos de Link

### `.link``
**Descrição:** Obtém o link atual do grupo para convites.

**Uso:**
```
.link

```

**Permissões:**
- ✅ Apenas administradores podem usar
- ✅ Bot deve ser administrador do grupo

**Exemplo de Resposta:**
```
🔗 Link do Grupo

📌 Nome: Meu Grupo de Trabalho
👥 Membros: 25
🔗 Link: https://chat.whatsapp.com/ABC123DEF456

Comandos relacionados:
• .resetlink - Gerar novo link
• .groupinfo - Informações do grupo
• .staff - Lista de administradores

🧜‍♀️ Sereia Bot
```

### `.resetlink`
**Descrição:** Gera um novo link de convite para o grupo (invalida o link anterior).

**Uso:**
```
.resetlink
.revoke
.anularlink
```

**Permissões:**
- ✅ Apenas administradores podem usar
- ✅ Bot deve ser administrador do grupo

**Exemplo de Resposta:**
```
✅ Group link has been successfully reset

📌 New link:
https://chat.whatsapp.com/NEW123CODE456
```

## 📊 Comandos de Informação

### `.groupinfo` 
**Descrição:** Exibe informações detalhadas do grupo.

**Uso:**
```
.groupinfo
.infogp
.infogrupo
```

**Informações Exibidas:**
- ID do grupo
- Nome do grupo
- Número de membros
- Proprietário do grupo
- Lista de administradores
- Descrição do grupo
- Foto do grupo

### `.staff`
**Descrição:** Lista todos os administradores do grupo.

**Uso:**
```
.staff
.admins
.listadmin
```

## 👥 Comandos de Menção

### `.tag <mensagem>`
**Descrição:** Marca um usuário específico com uma mensagem.

**Uso:**
```
.tag Olá, como está?
```

### `.tagall <mensagem>`
**Descrição:** Marca todos os usuários do grupo com uma mensagem.

**Uso:**
```
.tagall Reunião importante às 15h!
```

## 🤖 Comandos de Chatbot

### `.chatbot`
**Descrição:** Ativa ou desativa o chatbot do grupo.

**Uso:**
```
.chatbot
```

## 🛡️ Comandos de Moderação

### `.antitag <on/off>`
**Descrição:** Ativa/desativa proteção contra spam de tags.

**Uso:**
```
.antitag on
.antitag off
```

### `.welcome <on/off>`
**Descrição:** Ativa/desativa mensagem de boas-vindas.

**Uso:**
```
.welcome on
.welcome off
```

### `.goodbye <on/off>`
**Descrição:** Ativa/desativa mensagem de despedida.

**Uso:**
```
.goodbye on
.goodbye off
```

## 📝 Notas Importantes

1. **Permissões:** A maioria dos comandos requer que o usuário seja administrador do grupo.

2. **Bot Admin:** Alguns comandos (como `.link` e `.resetlink`) requerem que o bot seja administrador do grupo.

3. **Grupos Apenas:** Todos estes comandos só funcionam em grupos, não em conversas privadas.

4. **Segurança:** Links de grupo são sensíveis - use com cuidado e apenas com pessoas confiáveis.

## 🧜‍♀️ Sereia Bot

Desenvolvido com ❤️ pela equipe Sereia Bot.
