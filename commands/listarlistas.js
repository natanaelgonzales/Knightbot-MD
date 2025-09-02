const fs = require('fs');
const path = require('path');

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

async function listarlistasCommand(sock, chatId, message) {
    try {
        const isGroup = chatId.endsWith('@g.us');

        if (!isGroup) {
            await sock.sendMessage(chatId, {
                text: '❌ Este comando só pode ser usado em grupos.'
            }, { quoted: message });
            return;
        }

        // Carregar dados de agendamento
        const data = loadScheduleData();
        const groupSchedules = data.schedules[chatId] || [];

        if (groupSchedules.length === 0) {
            await sock.sendMessage(chatId, {
                text: '📋 *Nenhuma lista de agendamento encontrada neste grupo.*\n\nUse .criarlista para criar uma nova lista.'
            }, { quoted: message });
            return;
        }

        let messageText = '📋 *Listas de Agendamento - Sereia Bot*\n\n';

        groupSchedules.forEach((schedule, index) => {
            const status = schedule.active ? '✅ Ativa' : '⏸️ Pausada';
            const lastSent = schedule.lastSent ?
                new Date(schedule.lastSent).toLocaleString('pt-BR') :
                'Nunca enviada';

            const mentionStatus = schedule.shouldMention ? '✅ Sim' : '❌ Não';

            messageText += `*${index + 1}.* ID: \`${schedule.id}\`\n`;
            messageText += `📅 Dia: ${schedule.day.charAt(0).toUpperCase() + schedule.day.slice(1)}\n`;
            messageText += `⏰ Horário: ${schedule.time}\n`;
            messageText += `📝 Template: ${schedule.template.substring(0, 50)}${schedule.template.length > 50 ? '...' : ''}\n`;
            messageText += `👥 Marcar todos: ${mentionStatus}\n`;
            messageText += `📊 Status: ${status}\n`;
            messageText += `📈 Total enviadas: ${schedule.totalSent}\n`;
            messageText += `🕐 Última envio: ${lastSent}\n`;
            messageText += `👤 Criado por: ${schedule.createdBy.split('@')[0]}\n\n`;
        });

        messageText += `*Comandos úteis:*\n`;
        messageText += `• .removerlista <id> - Remover uma lista\n`;
        messageText += `• .pausarlista <id> - Pausar uma lista\n`;
        messageText += `• .ativarlista <id> - Ativar uma lista\n`;
        messageText += `• .criarlista - Criar nova lista`;

        await sock.sendMessage(chatId, {
            text: messageText
        }, { quoted: message });

    } catch (error) {
        console.error('Erro no comando listarlistas:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Erro interno. Tente novamente.'
        }, { quoted: message });
    }
}

module.exports = listarlistasCommand;
