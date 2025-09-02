# 📅 Sistema de Agendamento - Sereia Bot

O Sereia Bot possui um sistema completo de agendamento de mensagens que permite criar listas de mensagens recorrentes com templates personalizáveis.

## 🚀 Comandos Disponíveis

### 📝 Criar Lista de Agendamento
```
.criarlista <dia> <hora> [marcar] <template>
```

**Exemplos:**
```
.criarlista quarta 12:00 Lembrete: Reunião às {hora} do dia {data}
.criarlista quarta 12:00 marcar Lembrete: Reunião às {hora} do dia {data}
```

**Parâmetros:**
- `<dia>`: segunda, terça, quarta, quinta, sexta, sábado, domingo
- `<hora>`: Formato HH:MM (24 horas) - ex: 12:00, 14:30, 09:15
- `[marcar]`: Parâmetro opcional para mencionar todos os usuários do grupo
- `<template>`: Template da mensagem com variáveis

### 📋 Listar Agendamentos
```
.listarlistas
```
Mostra todas as listas de agendamento do grupo com:
- ID da lista
- Dia e horário
- Template da mensagem
- Status (ativa/pausada)
- Estatísticas de envio

### 🗑️ Remover Agendamento
```
.removerlista <id>
```

**Exemplo:**
```
.removerlista 1703123456789
```

### ⏸️ Pausar Agendamento
```
.pausarlista <id>
```

**Exemplo:**
```
.pausarlista 1703123456789
```

### ▶️ Ativar Agendamento
```
.ativarlista <id>
```

**Exemplo:**
```
.ativarlista 1703123456789
```

## 🎨 Variáveis do Template

Você pode usar as seguintes variáveis no template da mensagem:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{data}` | Data atual | 15/01/2024 |
| `{hora}` | Hora atual | 14:30 |
| `{dia}` | Dia da semana | segunda-feira |
| `{mes}` | Mês atual | janeiro |
| `{ano}` | Ano atual | 2024 |

## 📝 Exemplos de Templates

### Lembrete de Reunião (sem marcar)
```
.criarlista quarta 14:00 📅 *Reunião Semanal*

Olá pessoal! 

Lembrete: Reunião às {hora} do dia {data}.

Não se esqueçam! 🧜‍♀️
```

### Lembrete de Reunião (marcando todos)
```
.criarlista quarta 14:00 marcar 📅 *Reunião Semanal*

Olá pessoal! 

Lembrete: Reunião às {hora} do dia {data}.

Não se esqueçam! 🧜‍♀️
```

### Lembrete de Pagamento
```
.criarlista quinta 09:00 💰 *Lembrete de Pagamento*

Bom dia! 

Hoje é {dia}, {data}.

Lembrete: Verificar pagamentos pendentes.

Boa semana! 🌊
```

### Mensagem Motivacional
```
.criarlista segunda 08:00 🌅 *Bom Dia!*

Bom dia, equipe! 

Hoje é {dia}, {data}.

Que tenhamos uma excelente semana! 

Vamos nessa! 🧜‍♀️✨
```

### Lembrete de Tarefas
```
.criarlista sexta 17:00 📋 *Relatório Semanal*

Olá! 

Hoje é {dia}, {data}.

Lembrete: Enviar relatório semanal até 18h.

Obrigado! 🧜‍♀️
```

## 🔧 Funcionalidades

### ✅ Recursos Disponíveis
- **Agendamento Recorrente**: Mensagens enviadas automaticamente
- **Templates Dinâmicos**: Variáveis que se atualizam automaticamente
- **Controle de Status**: Pausar/ativar agendamentos
- **Estatísticas**: Contador de mensagens enviadas
- **Múltiplos Agendamentos**: Vários agendamentos por grupo
- **Timezone**: Configurado para America/Sao_Paulo

### 🛡️ Segurança
- **Apenas Admins**: Só administradores podem criar/gerenciar
- **Por Grupo**: Cada grupo tem seus próprios agendamentos
- **Persistência**: Agendamentos salvos em arquivo JSON
- **Recuperação**: Agendamentos são restaurados ao reiniciar o bot

## 📊 Gerenciamento

### Ver Estatísticas
Use `.listarlistas` para ver:
- Total de mensagens enviadas
- Data do último envio
- Status atual (ativa/pausada)
- Quem criou o agendamento

### Backup
Os agendamentos são salvos em:
```
data/schedule.json
```

### Logs
O bot registra:
- Criação de agendamentos
- Envio de mensagens
- Erros de agendamento
- Inicialização do sistema

## ⚠️ Limitações

- **Apenas Grupos**: Comandos só funcionam em grupos
- **Apenas Admins**: Só administradores podem usar
- **Timezone Fixo**: Configurado para America/Sao_Paulo
- **Máximo**: Sem limite de agendamentos por grupo

## 🚨 Troubleshooting

### Agendamento não funciona
1. Verifique se o bot é admin do grupo
2. Confirme se o agendamento está ativo
3. Verifique os logs do bot
4. Teste com `.listarlistas`

### Mensagem não enviada
1. Verifique se o horário está correto
2. Confirme se o template é válido
3. Verifique se o bot está online
4. Teste manualmente o template

### Erro de permissão
1. Certifique-se de ser admin do grupo
2. Verifique se o bot é admin
3. Teste com outro admin

## 🎯 Dicas de Uso

### Templates Eficazes
- Use emojis para chamar atenção
- Seja claro e objetivo
- Use variáveis para personalizar
- Mantenha mensagens concisas

### Horários Sugeridos
- **Manhã**: 08:00 - 09:00 (lembretes do dia)
- **Almoço**: 12:00 - 13:00 (lembretes gerais)
- **Tarde**: 14:00 - 15:00 (reuniões)
- **Final do dia**: 17:00 - 18:00 (relatórios)

### Boas Práticas
- Teste o template antes de agendar
- Use horários apropriados
- Não abuse dos agendamentos
- Monitore as estatísticas

---

**Nota**: O sistema de agendamento é uma funcionalidade avançada. Use com responsabilidade e sempre teste antes de implementar em grupos grandes.
