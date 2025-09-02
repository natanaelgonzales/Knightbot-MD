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
function createMessageTemplate(template, date) {
    const now = new Date();
    const currentDate = date || now;

    return template
        .replace(/{data}/g, currentDate.toLocaleDateString('pt-BR'))
        .replace(/{hora}/g, currentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
        .replace(/{dia}/g, currentDate.toLocaleDateString('pt-BR', { weekday: 'long' }))
        .replace(/{mes}/g, currentDate.toLocaleDateString('pt-BR', { month: 'long' }))
        .replace(/{ano}/g, currentDate.getFullYear());
}

async function criarlistaCommand(sock, chatId, message, args) {
    try {
        const isGroup = chatId.endsWith('@g.us');

        if (!isGroup) {
            await sock.sendMessage(chatId, {
                text: '❌ Este comando só pode ser usado em grupos.'
            }, { quoted: message });
            return;
        }

        // Verificar se o usuário é admin
        const isAdmin = await require('../lib/isAdmin')(sock, chatId, message.key.participant || message.key.remoteJid);

        if (!isAdmin.isSenderAdmin && !isAdmin.isBotAdmin) {
            await sock.sendMessage(chatId, {
                text: '❌ Apenas administradores podem usar este comando.'
            }, { quoted: message });
            return;
        }

        if (args.length < 3) {
            const helpText = `
🧜‍♀️ *Sereia Bot - Criar Lista de Agendamento*

*Uso:* .criarlista <dia> <hora> [marcar] <template>

*Exemplos:*
.criarlista quarta 12:00 Lembrete: Reunião às {hora} do dia {data}
.criarlista quarta 12:00 marcar Lembrete: Reunião às {hora} do dia {data}

*Dias válidos:*
• segunda, terça, quarta, quinta, sexta, sábado, domingo

*Horário formato:*
• HH:MM (24 horas)
• Exemplo: 12:00, 14:30, 09:15

*Parâmetro "marcar":*
• Use "marcar" para mencionar todos os usuários do grupo
• Sem "marcar": envia mensagem normal

*Variáveis do template:*
• {data} - Data atual
• {hora} - Hora atual
• {dia} - Dia da semana
• {mes} - Mês atual
• {ano} - Ano atual

*Comandos relacionados:*
• .listarlistas - Ver todas as listas
• .removerlista <id> - Remover uma lista
• .pausarlista <id> - Pausar uma lista
• .ativarlista <id> - Ativar uma lista
            `;

            await sock.sendMessage(chatId, {
                text: helpText
            }, { quoted: message });
            return;
        }

        const [day, time, ...templateParts] = args;

        // Verificar se tem o parâmetro "marcar"
        const shouldMention = templateParts[0] === 'marcar';
        const template = shouldMention ? templateParts.slice(1).join(' ') : templateParts.join(' ');

        // Validar dia
        if (!validateDay(day)) {
            await sock.sendMessage(chatId, {
                text: '❌ Dia inválido. Use: segunda, terça, quarta, quinta, sexta, sábado, domingo'
            }, { quoted: message });
            return;
        }

        // Validar horário
        if (!validateTime(time)) {
            await sock.sendMessage(chatId, {
                text: '❌ Horário inválido. Use formato HH:MM (ex: 12:00, 14:30)'
            }, { quoted: message });
            return;
        }

        // Validar template
        if (!template || template.length < 5) {
            await sock.sendMessage(chatId, {
                text: '❌ Template muito curto. Mínimo 5 caracteres.'
            }, { quoted: message });
            return;
        }

        // Carregar dados existentes
        const data = loadScheduleData();

        // Gerar ID único para a lista
        const listId = Date.now().toString();

        // Criar entrada de agendamento
        const schedule = {
            id: listId,
            chatId: chatId,
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
        if (!data.schedules[chatId]) {
            data.schedules[chatId] = [];
        }

        data.schedules[chatId].push(schedule);

        // Salvar dados
        if (saveScheduleData(data)) {
            // Configurar cron job
            const [hours, minutes] = time.split(':');
            const cronExpression = `${minutes} ${hours} * * ${schedule.dayNumber}`;

            // Criar task do cron
            const task = cron.schedule(cronExpression, async () => {
                try {
                    const currentData = loadScheduleData();
                    const currentSchedule = currentData.schedules[chatId]?.find(s => s.id === listId);

                    if (currentSchedule && currentSchedule.active) {
                        const messageText = createMessageTemplate(currentSchedule.template);

                        // Preparar mensagem com ou sem mentions
                        let messageOptions = { text: messageText };

                        if (currentSchedule.shouldMention) {
                            try {
                                // Obter participantes do grupo
                                const groupMetadata = await sock.groupMetadata(chatId);
                                const participants = groupMetadata.participants;

                                messageOptions.mentions = participants.map(p => p.id);
                            } catch (error) {
                                console.error('Erro ao obter participantes para mention:', error);
                            }
                        }

                        await sock.sendMessage(chatId, messageOptions);

                        // Atualizar estatísticas
                        currentSchedule.lastSent = new Date().toISOString();
                        currentSchedule.totalSent++;
                        saveScheduleData(currentData);

                        console.log(`📅 Mensagem agendada enviada para ${chatId}: ${messageText}${currentSchedule.shouldMention ? ' (com mentions)' : ''}`);
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

            const successMessage = `
✅ *Lista de agendamento criada com sucesso!*

📋 *ID:* ${listId}
📅 *Dia:* ${day.charAt(0).toUpperCase() + day.slice(1)}
⏰ *Horário:* ${time}
📝 *Template:* ${template}
👥 *Marcar todos:* ${mentionStatus}

🧜‍♀️ A mensagem será enviada automaticamente toda ${day} às ${time}.

*Comandos úteis:*
• .listarlistas - Ver todas as listas
• .removerlista ${listId} - Remover esta lista
• .pausarlista ${listId} - Pausar esta lista
            `;

            await sock.sendMessage(chatId, {
                text: successMessage
            }, { quoted: message });

        } else {
            await sock.sendMessage(chatId, {
                text: '❌ Erro ao salvar a lista de agendamento.'
            }, { quoted: message });
        }

    } catch (error) {
        console.error('Erro no comando criarlista:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Erro interno. Tente novamente.'
        }, { quoted: message });
    }
}

module.exports = criarlistaCommand;
