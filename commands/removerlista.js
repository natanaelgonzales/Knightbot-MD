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

async function removerlistaCommand(sock, chatId, message, args) {
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

        if (args.length < 1) {
            await sock.sendMessage(chatId, {
                text: '❌ *Uso:* .removerlista <id>\n\nUse .listarlistas para ver os IDs disponíveis.'
            }, { quoted: message });
            return;
        }

        const listId = args[0];

        // Carregar dados de agendamento
        const data = loadScheduleData();
        const groupSchedules = data.schedules[chatId] || [];

        // Encontrar a lista pelo ID
        const scheduleIndex = groupSchedules.findIndex(schedule => schedule.id === listId);

        if (scheduleIndex === -1) {
            await sock.sendMessage(chatId, {
                text: '❌ Lista não encontrada. Use .listarlistas para ver os IDs disponíveis.'
            }, { quoted: message });
            return;
        }

        const schedule = groupSchedules[scheduleIndex];

        // Parar o cron job se existir
        if (global.scheduleTasks && global.scheduleTasks[listId]) {
            const task = global.scheduleTasks[listId];
            if (task && typeof task.stop === 'function') {
                task.stop();
            }
            if (task && typeof task.destroy === 'function') {
                task.destroy();
            }
            delete global.scheduleTasks[listId];
        }

        // Remover da lista
        groupSchedules.splice(scheduleIndex, 1);

        // Se não há mais agendamentos no grupo, remover o grupo
        if (groupSchedules.length === 0) {
            delete data.schedules[chatId];
        } else {
            data.schedules[chatId] = groupSchedules;
        }

        // Salvar dados
        if (saveScheduleData(data)) {
            const successMessage = `
✅ *Lista removida com sucesso!*

📋 *ID removido:* ${listId}
📅 *Dia:* ${schedule.day.charAt(0).toUpperCase() + schedule.day.slice(1)}
⏰ *Horário:* ${schedule.time}
📝 *Template:* ${schedule.template.substring(0, 50)}${schedule.template.length > 50 ? '...' : ''}

🧜‍♀️ A mensagem não será mais enviada automaticamente.
            `;

            await sock.sendMessage(chatId, {
                text: successMessage
            }, { quoted: message });

        } else {
            await sock.sendMessage(chatId, {
                text: '❌ Erro ao remover a lista de agendamento.'
            }, { quoted: message });
        }

    } catch (error) {
        console.error('Erro no comando removerlista:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Erro interno. Tente novamente.'
        }, { quoted: message });
    }
}

module.exports = removerlistaCommand;
