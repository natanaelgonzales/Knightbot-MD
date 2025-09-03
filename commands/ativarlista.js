const isAdmin = require('../lib/isAdmin');  // Move isAdmin to helpers
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

async function ativarlistaCommand(sock, chatId, message, args) {
    try {
        const isGroup = chatId.endsWith('@g.us');

        if (!isGroup) {
            await sock.sendMessage(chatId, {
                text: '❌ Este comando só pode ser usado em grupos.'
            }, { quoted: message });
            return;
        }

        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isSenderAdmin && !isBotAdmin) {
            await sock.sendMessage(chatId, {
                text: 'Somente administradores podem usar este comando.'
            });
            return;
        }

        if (args.length < 1) {
            await sock.sendMessage(chatId, {
                text: '❌ *Uso:* .ativarlista <id>\n\nUse .listarlistas para ver os IDs disponíveis.'
            }, { quoted: message });
            return;
        }

        const listId = args[0];

        // Carregar dados de agendamento
        const data = loadScheduleData();
        const groupSchedules = data.schedules[chatId] || [];

        // Encontrar a lista pelo ID
        const schedule = groupSchedules.find(s => s.id === listId);

        if (!schedule) {
            await sock.sendMessage(chatId, {
                text: '❌ Lista não encontrada. Use .listarlistas para ver os IDs disponíveis.'
            }, { quoted: message });
            return;
        }

        // Se já está ativa, informar
        if (schedule.active) {
            await sock.sendMessage(chatId, {
                text: 'ℹ️ Esta lista já está ativa.'
            }, { quoted: message });
            return;
        }

        // Ativar a lista
        schedule.active = true;

        // Recriar o cron job
        const [hours, minutes] = schedule.time.split(':');
        const cronExpression = `${minutes} ${hours} * * ${schedule.dayNumber}`;

        // Parar task existente se houver
        if (global.scheduleTasks && global.scheduleTasks[listId]) {
            const existingTask = global.scheduleTasks[listId];
            if (existingTask && typeof existingTask.stop === 'function') {
                existingTask.stop();
            }
            if (existingTask && typeof existingTask.destroy === 'function') {
                existingTask.destroy();
            }
        }

        // Criar nova task
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

        // Salvar dados
        if (saveScheduleData(data)) {
            const successMessage = `
▶️ *Lista ativada com sucesso!*

📋 *ID:* ${listId}
📅 *Dia:* ${schedule.day.charAt(0).toUpperCase() + schedule.day.slice(1)}
⏰ *Horário:* ${schedule.time}
📊 *Status:* ✅ Ativa

🧜‍♀️ A mensagem será enviada automaticamente.
            `;

            await sock.sendMessage(chatId, {
                text: successMessage
            }, { quoted: message });

        } else {
            await sock.sendMessage(chatId, {
                text: '❌ Erro ao ativar a lista de agendamento.'
            }, { quoted: message });
        }

    } catch (error) {
        console.error('Erro no comando ativarlista:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Erro interno. Tente novamente.'
        }, { quoted: message });
    }
}

module.exports = ativarlistaCommand;
