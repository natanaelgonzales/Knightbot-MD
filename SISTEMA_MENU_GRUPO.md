# 🧜‍♀️ Sistema de Menu Personalizado por Grupo

Este documento descreve o novo sistema de menu personalizado por grupo do Sereia Bot.

## 📋 Visão Geral

O sistema permite que cada grupo tenha sua própria configuração de comandos:
- **Padrão**: Todos os comandos estão bloqueados
- **Personalização**: Administradores podem habilitar comandos específicos
- **Aliases**: Grupos podem ter nomes personalizados para uso no chat privado
- **Controle remoto**: Gerenciamento via chat privado com o bot

## 🎯 Funcionalidades Principais

### 1. Sistema de Permissões por Grupo
- Cada grupo tem sua própria lista de comandos habilitados
- Comandos bloqueados por padrão
- Apenas administradores podem configurar

### 2. Sistema de Aliases
- Grupos podem ter nomes personalizados (aliases)
- Facilita o gerenciamento de múltiplos grupos
- Uso no chat privado com o bot

### 3. Chat Privado do Bot
- Gerenciamento remoto de grupos
- Envio de mensagens para grupos específicos
- Criação de agendamentos remotos

## 🛠️ Comandos Disponíveis

### Comandos de Grupo (`.groupmenu`)

#### Configuração Básica
```
.groupmenu                    # Mostrar menu de configuração
.groupmenu status             # Ver status atual do grupo
.groupmenu list               # Listar todos os comandos disponíveis
.groupmenu reset              # Resetar configurações do grupo
```

#### Gerenciamento de Comandos
```
.groupmenu enable <comando>   # Habilitar comando
.groupmenu disable <comando>  # Desabilitar comando
```

**Exemplos:**
```
.groupmenu enable .joke
.groupmenu disable .ban
.groupmenu enable .weather
```

#### Sistema de Aliases
```
💡 *Gerenciamento de aliases movido para chat privado*
```

### Comandos de Chat Privado (`.privatechat`)

#### Listagem e Informações
```
.privatechat                  # Mostrar menu do chat privado
.privatechat list             # Listar todos os grupos
.privatechat info <alias>     # Informações de um grupo
.privatechat commands <alias> # Ver comandos habilitados
```

#### Gerenciamento Remoto
```
.privatechat enable <alias> <comando>   # Habilitar comando remotamente
.privatechat disable <alias> <comando>  # Desabilitar comando remotamente
```

#### Envio de Mensagens
```
.privatechat send <alias> <mensagem>    # Enviar mensagem para grupo
```

#### Agendamento Remoto
```
.privatechat schedule <alias> <dia> <hora> <template>  # Criar agendamento
```

#### Gerenciamento de Aliases
```
.privatechat createalias <chatId> <alias>  # Criar alias para grupo
.privatechat removealias <alias>           # Remover alias
.privatechat groups                        # Listar grupos disponíveis
```

**Exemplos:**
```
.privatechat send "Meu Grupo" Olá pessoal!
.privatechat schedule "Meu Grupo" quarta 12:00 Lembrete: Reunião às {hora}
.privatechat enable "Meu Grupo" .joke
.privatechat createalias 120363123456789012@g.us "Meu Grupo"
.privatechat groups
```

### Comando de Agendamento Atualizado (`.criarlista`)

Agora suporta aliases:
```
.criarlista <dia> <hora> [marcar] <template>                    # Grupo atual
.criarlista <alias> <dia> <hora> [marcar] <template>           # Grupo por alias
```

**Exemplos:**
```
.criarlista quarta 12:00 Lembrete: Reunião às {hora}
.criarlista "Meu Grupo" quarta 12:00 marcar Lembrete: Reunião às {hora}
```

## 📊 Comandos Sempre Permitidos

Estes comandos sempre funcionam, mesmo quando outros estão bloqueados:
- `.groupmenu` - Configuração do grupo
- `.help` / `.menu` - Ajuda
- `.ping` - Teste de conectividade
- `.alive` - Status do bot

## 🔧 Configuração Inicial

### 1. Configurar um Grupo

1. **Criar alias (no chat privado):**
   ```
   .privatechat groups
   .privatechat createalias 120363123456789012@g.us "Nome do Grupo"
   ```

2. **Habilitar comandos desejados (no grupo):**
   ```
   .groupmenu enable .joke
   .groupmenu enable .weather
   .groupmenu enable .criarlista
   ```

3. **Verificar configuração:**
   ```
   .groupmenu status
   ```

### 2. Usar Chat Privado

1. **Listar grupos:**
   ```
   .privatechat list
   ```

2. **Enviar mensagem:**
   ```
   .privatechat send "Nome do Grupo" Sua mensagem aqui
   ```

3. **Criar agendamento:**
   ```
   .privatechat schedule "Nome do Grupo" quarta 12:00 Lembrete: Reunião
   ```

## 📁 Estrutura de Arquivos

```
lib/
├── groupSettings.js          # Gerenciador de configurações
commands/
├── groupmenu.js             # Comando de configuração de grupo
├── privatechat.js           # Comando de chat privado
└── criarlista.js            # Comando de agendamento (atualizado)
data/
└── groupSettings.json       # Dados de configuração (criado automaticamente)
```

## 🔒 Segurança

- Apenas administradores podem configurar comandos
- Bot deve ser administrador para funcionar corretamente
- Comandos de owner sempre funcionam independente das configurações
- Sistema de permissões por grupo isolado

## 🚀 Exemplos de Uso

### Cenário 1: Grupo de Trabalho
```
# No chat privado (criar alias):
.privatechat groups
.privatechat createalias 120363123456789012@g.us "Trabalho"

# No grupo (habilitar comandos):
.groupmenu enable .criarlista
.groupmenu enable .weather
.groupmenu enable .joke

# No chat privado (gerenciar):
.privatechat schedule "Trabalho" segunda 09:00 Bom dia! Reunião às 10h
.privatechat send "Trabalho" Lembrete: Relatório até sexta
```

### Cenário 2: Grupo de Amigos
```
# No chat privado (criar alias):
.privatechat createalias 120363123456789013@g.us "Amigos"

# No grupo (habilitar comandos):
.groupmenu enable .joke
.groupmenu enable .compliment
.groupmenu enable .ship

# No chat privado (gerenciar):
.privatechat send "Amigos" Galera, vamos sair hoje?
```

### Cenário 3: Grupo Restritivo
```
# No chat privado (criar alias):
.privatechat createalias 120363123456789014@g.us "Grupo Sério"

# No grupo (habilitar comandos):
.groupmenu enable .help
.groupmenu enable .ping
# Apenas comandos básicos habilitados
```

## 🐛 Solução de Problemas

### Comando não funciona
1. Verificar se está habilitado: `.groupmenu status`
2. Habilitar comando: `.groupmenu enable <comando>`
3. Verificar se o bot é admin do grupo

### Alias não encontrado
1. Verificar se foi criado: `.privatechat list`
2. Criar alias: `.privatechat createalias <chatId> "Nome"`
3. Verificar ortografia
4. Listar grupos disponíveis: `.privatechat groups`

### Agendamento não funciona
1. Verificar se `.criarlista` está habilitado
2. Verificar formato do horário (HH:MM)
3. Verificar dia da semana

## 📝 Notas Importantes

- Configurações são salvas automaticamente
- Aliases são únicos (não podem ser duplicados)
- Sistema funciona independente para cada grupo
- Chat privado só funciona com o número do bot
- Agendamentos usam timezone "America/Sao_Paulo"
- **Gerenciamento de aliases é privado** - apenas no chat privado com o bot
- Membros do grupo não veem mensagens de configuração de aliases

---

🧜‍♀️ **Sereia Bot** - Sistema de Menu Personalizado por Grupo
