const isAdmin = require('../lib/isAdmin');
const groupSettings = require('../lib/groupSettings');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

// Função para carregar dados de agendamento
function loadScheduleData() {
    try {
        const dataPath = path.join(__dirname, '../data/schedule.json');
        if (fs.existsSync(dataPath)) {
            return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        }
        return { schedules: {} };
    } catch (error) {
        console.error('Error loading schedule data:', error);
        return { schedules: {} };
    }
}

// Função para salvar dados de agendamento
function saveScheduleData(data) {
    try {
        const dataPath = path.join(__dirname, '../data/schedule.json');
        const dataDir = path.dirname(dataPath);

        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving schedule data:', error);
        return false;
    }
}

// Função para validar horário
function validateTime(timeStr) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    return timeRegex.test(timeStr);
}

// Função para validar dia da semana
function validateDay(dayStr) {
    const days = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
    return days.includes(dayStr.toLowerCase());
}

// Função para converter dia para número (0 = domingo, 1 = segunda, etc.)
function dayToNumber(dayStr) {
    const dayMap = {
        'domingo': 0,
        'segunda': 1,
        'terça': 2,
        'quarta': 3,
        'quinta': 4,
        'sexta': 5,
        'sábado': 6
    };
    return dayMap[dayStr.toLowerCase()];
}

// Função para criar template de mensagem
function createMessageTemplate(template, scheduledDay, scheduledTime) {
    const now = new Date();

    // Usar a data atual como referência (quando o agendamento foi criado)
    const referenceDate = new Date(now);

    // Processar variáveis com operações matemáticas
    let processedTemplate = template;

    // Processar {data+/-N} ou {data}
    processedTemplate = processedTemplate.replace(/{data([+-]\d+)?}/g, (match, operation) => {
        const date = new Date(referenceDate);
        if (operation) {
            const days = parseInt(operation);
            date.setDate(date.getDate() + days);
        }
        return date.toLocaleDateString('pt-BR');
    });

    // Processar {dia+/-N} ou {dia}
    processedTemplate = processedTemplate.replace(/{dia([+-]\d+)?}/g, (match, operation) => {
        const date = new Date(referenceDate);
        if (operation) {
            const days = parseInt(operation);
            date.setDate(date.getDate() + days);
        }
        return date.toLocaleDateString('pt-BR', { weekday: 'long' });
    });

    // Processar {mes+/-N} ou {mes}
    processedTemplate = processedTemplate.replace(/{mes([+-]\d+)?}/g, (match, operation) => {
        const date = new Date(referenceDate);
        if (operation) {
            const days = parseInt(operation);
            date.setDate(date.getDate() + days);
        }
        return date.toLocaleDateString('pt-BR', { month: 'long' });
    });

    // Processar {ano+/-N} ou {ano}
    processedTemplate = processedTemplate.replace(/{ano([+-]\d+)?}/g, (match, operation) => {
        const date = new Date(referenceDate);
        if (operation) {
            const days = parseInt(operation);
            date.setDate(date.getDate() + days);
        }
        return date.getFullYear().toString();
    });

    // Variáveis simples (sem operações)
    processedTemplate = processedTemplate
        .replace(/{hora}/g, scheduledTime);

    return processedTemplate;
}

// Função para calcular a próxima data do dia agendado
function getNextScheduledDate(scheduledDay, scheduledTime) {
    const now = new Date();
    const today = now.getDay(); // 0 = domingo, 1 = segunda, etc.

    // Mapear dias da semana
    const dayMap = {
        'domingo': 0,
        'segunda': 1,
        'terça': 2,
        'quarta': 3,
        'quinta': 4,
        'sexta': 5,
        'sábado': 6
    };

    const scheduledDayNumber = dayMap[scheduledDay.toLowerCase()];
    if (scheduledDayNumber === undefined) {
        return now; // Fallback para hoje se dia inválido
    }

    // Calcular dias até a próxima ocorrência
    let daysUntilNext = scheduledDayNumber - today;
    if (daysUntilNext <= 0) {
        daysUntilNext += 7; // Próxima semana
    }

    // Criar a data da próxima ocorrência
    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + daysUntilNext);

    // Definir a hora agendada
    const [hours, minutes] = scheduledTime.split(':');
    nextDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    return nextDate;
}

async function criarlistaCommand(sock, chatId, senderId, message, args, isPrivateCall = false) {
    try {
        // Validar parâmetros
        if (!sock || !chatId || !senderId) {
            console.error('Parâmetros inválidos para criarlistaCommand');
            return;
        }

        // Garantir que message seja um objeto válido
        if (!message || typeof message !== 'object') {
            message = { key: { participant: senderId, remoteJid: chatId } };
        }

        const isGroup = chatId.endsWith('@g.us');

        if (!isGroup) {
            await sock.sendMessage(chatId, {
                text: '❌ Este comando só pode ser usado em grupos.'
            }, message ? { quoted: message } : {});
            return;
        }

        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isSenderAdmin && !isBotAdmin) {
            await sock.sendMessage(chatId, {
                text: 'Somente administradores podem usar este comando.'
            });
            return;
        }

        if (args.length < 3) {
            if (!isPrivateCall) {
                const helpText = `
🧜‍♀️ *Sereia Bot - Criar Lista de Agendamento*

*Uso:* .criarlista <dia> <hora> [marcar] <template>
*Uso com alias:* .criarlista <alias> <dia> <hora> [marcar] <template>

*Exemplos:*
.criarlista quarta 12:00 Lembrete: Reunião às {hora} do dia {data}
.criarlista quarta 12:00 marcar Lembrete: Reunião às {hora} do dia {data}
.criarlista "Meu Grupo" quarta 12:00 Lembrete: Reunião às {hora}

*Exemplo dinâmico:*
Se hoje é segunda (08/09) e você agenda:
.criarlista quarta 21:00 Reunião na {dia} {data} às {hora}
A mensagem será: "Reunião na segunda-feira 08/09 às 21:00"

*Exemplo com operações:*
.criarlista quarta 21:00 Reunião na {dia+2} {data+2} às {hora}
Se hoje é segunda (08/09), a mensagem será: "Reunião na quarta-feira 10/09 às 21:00"

*Dias válidos:*
• segunda, terça, quarta, quinta, sexta, sábado, domingo

*Horário formato:*
• HH:MM (24 horas)
• Exemplo: 12:00, 14:30, 09:15

*Parâmetro "marcar":*
• Use "marcar" para mencionar todos os usuários do grupo
• Sem "marcar": envia mensagem normal

*Variáveis do template:*
• {data} - Data atual (quando o agendamento foi criado)
• {data+N} - Data atual + N dias (ex: {data+2} = +2 dias)
• {data-N} - Data atual - N dias (ex: {data-1} = -1 dia)
• {hora} - Hora agendada
• {dia} - Dia da semana atual
• {dia+N} - Dia da semana + N dias (ex: {dia+2})
• {dia-N} - Dia da semana - N dias (ex: {dia-1})
• {mes} - Mês atual
• {mes+N} - Mês + N dias (ex: {mes+2})
• {mes-N} - Mês - N dias (ex: {mes-1})
• {ano} - Ano atual
• {ano+N} - Ano + N dias (ex: {ano+2})
• {ano-N} - Ano - N dias (ex: {ano-1})

*Comandos relacionados:*
• .listarlistas - Ver todas as listas
• .removerlista <id> - Remover uma lista
• .pausarlista <id> - Pausar uma lista
• .ativarlista <id> - Ativar uma lista
• .groupmenu - Configurar comandos do grupo
            `;

                await sock.sendMessage(chatId, {
                    text: helpText
                }, message ? { quoted: message } : {});
            }
            return;
        }

        // Verificar se o primeiro argumento é um alias
        let targetChatId = chatId;
        let day, time, templateParts;

        // Verificar se o primeiro argumento é um alias (entre aspas ou sem espaços)
        const firstArg = args[0];
        const possibleAlias = groupSettings.getChatIdByAlias(firstArg);

        if (possibleAlias) {
            // É um alias, usar o chatId do alias
            targetChatId = possibleAlias;
            [day, time, ...templateParts] = args.slice(1);
        } else {
            // Não é um alias, usar o chatId atual
            [day, time, ...templateParts] = args;
        }

        // Verificar se tem o parâmetro "marcar"
        const shouldMention = templateParts[0] === 'marcar';
        const template = shouldMention ? templateParts.slice(1).join(' ') : templateParts.join(' ');

        // Validar dia
        if (!validateDay(day)) {
            if (!isPrivateCall) {
                await sock.sendMessage(chatId, {
                    text: '❌ Dia inválido. Use: segunda, terça, quarta, quinta, sexta, sábado, domingo'
                }, message ? { quoted: message } : {});
            } return;
        }

        // Validar horário
        if (!validateTime(time)) {
            if (!isPrivateCall) {
                await sock.sendMessage(chatId, {
                    text: '❌ Horário inválido. Use formato HH:MM (ex: 12:00, 14:30)'
                }, message ? { quoted: message } : {});
            } return;
        }

        // Validar template
        if (!template || template.length < 5) {
            if (!isPrivateCall) {
                await sock.sendMessage(chatId, {
                    text: '❌ Template muito curto. Mínimo 5 caracteres.'
                }, message ? { quoted: message } : {});
            } return;
        }

        // Carregar dados existentes
        const data = loadScheduleData();

        // Gerar ID único para a lista
        const listId = Date.now().toString();

        // Criar entrada de agendamento
        const schedule = {
            id: listId,
            chatId: targetChatId,
            day: day.toLowerCase(),
            dayNumber: dayToNumber(day),
            time: time,
            template: template,
            shouldMention: shouldMention,
            createdBy: message.key.participant || message.key.remoteJid,
            createdAt: new Date().toISOString(),
            active: true,
            lastSent: null,
            totalSent: 0
        };

        // Adicionar ao grupo de agendamentos
        if (!data.schedules[targetChatId]) {
            data.schedules[targetChatId] = [];
        }

        data.schedules[targetChatId].push(schedule);

        // Salvar dados
        if (saveScheduleData(data)) {
            // Configurar cron job
            const [hours, minutes] = time.split(':');
            const cronExpression = `${minutes} ${hours} * * ${schedule.dayNumber}`;

            // Criar task do cron
            const task = cron.schedule(cronExpression, async () => {
                try {
                    const currentData = loadScheduleData();
                    const currentSchedule = currentData.schedules[targetChatId]?.find(s => s.id === listId);

                    if (currentSchedule && currentSchedule.active) {
                        const messageText = createMessageTemplate(currentSchedule.template, currentSchedule.day, currentSchedule.time);

                        // Preparar mensagem com ou sem mentions
                        let messageOptions = { text: messageText };

                        if (currentSchedule.shouldMention) {
                            try {
                                // Obter participantes do grupo
                                const groupMetadata = await sock.groupMetadata(targetChatId);
                                const participants = groupMetadata.participants;

                                messageOptions.mentions = participants.map(p => p.id);
                            } catch (error) {
                                console.error('Erro ao obter participantes para mention:', error);
                            }
                        }

                        await sock.sendMessage(targetChatId, messageOptions);

                        // Atualizar estatísticas
                        currentSchedule.lastSent = new Date().toISOString();
                        currentSchedule.totalSent++;
                        saveScheduleData(currentData);

                        console.log(`📅 Mensagem agendada enviada para ${targetChatId}: ${messageText}${currentSchedule.shouldMention ? ' (com mentions)' : ''}`);
                    }
                } catch (error) {
                    console.error('Erro ao enviar mensagem agendada:', error);
                }
            }, {
                scheduled: true,
                timezone: "America/Sao_Paulo"
            });

            // Armazenar referência da task
            if (!global.scheduleTasks) {
                global.scheduleTasks = {};
            }
            global.scheduleTasks[listId] = task;

            const mentionStatus = shouldMention ? '✅ Sim (marcará todos)' : '❌ Não';
            const targetInfo = targetChatId !== chatId ? `\n🎯 *Grupo alvo:* ${firstArg}` : '';

            const successMessage = `
✅ *Lista de agendamento criada com sucesso!*

📋 *ID:* ${listId}
📅 *Dia:* ${day.charAt(0).toUpperCase() + day.slice(1)}
⏰ *Horário:* ${time}
📝 *Template:* ${template}
👥 *Marcar todos:* ${mentionStatus}${targetInfo}

🧜‍♀️ A mensagem será enviada automaticamente toda ${day} às ${time}.

*Comandos úteis:*
• .listarlistas - Ver todas as listas
• .removerlista ${listId} - Remover esta lista
• .pausarlista ${listId} - Pausar esta lista
            `;

            // Só enviar mensagem de sucesso se não for chamada privada
            if (!isPrivateCall) {
                await sock.sendMessage(chatId, {
                    text: successMessage
                }, message ? { quoted: message } : {});
            }

        } else {
            // Só enviar mensagem de erro se não for chamada privada
            if (!isPrivateCall) {
                await sock.sendMessage(chatId, {
                    text: '❌ Erro ao salvar a lista de agendamento.'
                }, message ? { quoted: message } : {});
            }
        }

    } catch (error) {
        console.error('Erro no comando criarlista:', error);
        // Só enviar mensagem de erro se não for chamada privada
        if (!isPrivateCall) {
            await sock.sendMessage(chatId, {
                text: '❌ Erro interno. Tente novamente.'
            }, message ? { quoted: message } : {});
        }
    }
}

module.exports = criarlistaCommand;
