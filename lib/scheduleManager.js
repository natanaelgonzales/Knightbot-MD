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

// Função para inicializar todos os agendamentos
function initializeSchedules(sock) {
    console.log('📅 Inicializando agendamentos...');

    const data = loadScheduleData();
    global.scheduleTasks = global.scheduleTasks || {};

    // Limpar tasks existentes
    Object.values(global.scheduleTasks).forEach(task => {
        if (task) {
            if (typeof task.stop === 'function') {
                task.stop();
            }
            if (typeof task.destroy === 'function') {
                task.destroy();
            }
        }
    });
    global.scheduleTasks = {};

    // Inicializar cada agendamento
    Object.entries(data.schedules).forEach(([chatId, schedules]) => {
        schedules.forEach(schedule => {
            if (schedule.active) {
                createScheduleTask(sock, schedule);
            }
        });
    });

    console.log(`✅ ${Object.keys(global.scheduleTasks).length} agendamentos inicializados.`);
}

// Função para criar uma task de agendamento
function createScheduleTask(sock, schedule) {
    try {
        const [hours, minutes] = schedule.time.split(':');
        const cronExpression = `${minutes} ${hours} * * ${schedule.dayNumber}`;

        const task = cron.schedule(cronExpression, async () => {
            try {
                const currentData = loadScheduleData();
                const currentSchedule = currentData.schedules[schedule.chatId]?.find(s => s.id === schedule.id);

                if (currentSchedule && currentSchedule.active) {
                    const messageText = createMessageTemplate(currentSchedule.template);

                    // Preparar mensagem com ou sem mentions
                    let messageOptions = { text: messageText };

                    if (currentSchedule.shouldMention) {
                        try {
                            // Obter participantes do grupo
                            const groupMetadata = await sock.groupMetadata(schedule.chatId);
                            const participants = groupMetadata.participants;

                            messageOptions.mentions = participants.map(p => p.id);
                        } catch (error) {
                            console.error('Erro ao obter participantes para mention:', error);
                        }
                    }

                    await sock.sendMessage(schedule.chatId, messageOptions);

                    // Atualizar estatísticas
                    currentSchedule.lastSent = new Date().toISOString();
                    currentSchedule.totalSent++;
                    saveScheduleData(currentData);

                    console.log(`📅 Mensagem agendada enviada para ${schedule.chatId}: ${messageText.substring(0, 50)}...${currentSchedule.shouldMention ? ' (com mentions)' : ''}`);
                }
            } catch (error) {
                console.error('Erro ao enviar mensagem agendada:', error);
            }
        }, {
            scheduled: true,
            timezone: "America/Sao_Paulo"
        });

        global.scheduleTasks[schedule.id] = task;
        console.log(`📅 Agendamento criado: ${schedule.day} ${schedule.time} para ${schedule.chatId}`);

    } catch (error) {
        console.error('Erro ao criar task de agendamento:', error);
    }
}

// Função para parar um agendamento específico
function stopSchedule(scheduleId) {
    if (global.scheduleTasks && global.scheduleTasks[scheduleId]) {
        const task = global.scheduleTasks[scheduleId];
        if (task) {
            if (typeof task.stop === 'function') {
                task.stop();
            }
            if (typeof task.destroy === 'function') {
                task.destroy();
            }
        }
        delete global.scheduleTasks[scheduleId];
        console.log(`📅 Agendamento ${scheduleId} parado.`);
    }
}

// Função para parar todos os agendamentos
function stopAllSchedules() {
    if (global.scheduleTasks) {
        Object.entries(global.scheduleTasks).forEach(([id, task]) => {
            if (task) {
                if (typeof task.stop === 'function') {
                    task.stop();
                }
                if (typeof task.destroy === 'function') {
                    task.destroy();
                }
            }
        });
        global.scheduleTasks = {};
        console.log('📅 Todos os agendamentos parados.');
    }
}

module.exports = {
    loadScheduleData,
    saveScheduleData,
    createMessageTemplate,
    initializeSchedules,
    createScheduleTask,
    stopSchedule,
    stopAllSchedules
};
