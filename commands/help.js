const settings = require('../settings');
const groupSettings = require('../lib/groupSettings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
    try {
        const isGroup = chatId.endsWith('@g.us');

        // Comandos que sempre estão disponíveis
        const alwaysAvailable = ['.help', '.menu', '.ping', '.alive'];

        let enabledCommands = [];

        if (isGroup) {
            // Para grupos, obter comandos habilitados
            const groupSettingsData = groupSettings.getGroupSettings(chatId);
            enabledCommands = groupSettingsData.enabledCommands || [];
        } else {
            // Para chat privado, mostrar todos os comandos
            enabledCommands = groupSettings.getAvailableCommands();
        }

        // Combinar comandos sempre disponíveis com habilitados
        const allAvailableCommands = [...new Set([...alwaysAvailable, ...enabledCommands])];

        // Organizar comandos por categoria
        const commandCategories = {
            '🌐 Geral': ['.help', '.menu', '.ping', '.alive', '.owner', '.joke', '.quote', '.fact', '.weather', '.news', '.attp', '.lyrics', '.8ball', '.groupinfo', '.staff', '.admins', '.vv', '.trt', '.ss', '.jid'],
            '👮‍♂️ Admin': ['.ban', '.unban', '.promote', '.demote', '.mute', '.unmute', '.delete', '.del', '.kick', '.warnings', '.warn', '.antilink', '.antibadword', '.clear', '.tag', '.tagall', '.chatbot', '.link', '.resetlink', '.antitag', '.welcome', '.goodbye'],
            '📅 Agendamento': ['.criarlista', '.listarlistas', '.removerlista', '.pausarlista', '.ativarlista'],
            '🎨 Imagem/Sticker': ['.blur', '.simage', '.sticker', '.removebg', '.remini', '.crop', '.tgsticker', '.meme', '.take', '.emojimix'],
            '🎮 Jogos': ['.tictactoe', '.hangman', '.guess', '.trivia', '.answer', '.truth', '.dare'],
            '🤖 IA': ['.gpt', '.gemini', '.imagine', '.flux'],
            '🎯 Diversão': ['.compliment', '.insult', '.flirt', '.shayari', '.goodnight', '.roseday', '.character', '.wasted', '.ship', '.simp', '.stupid'],
            '🔤 Textmaker': ['.metallic', '.ice', '.snow', '.impressive', '.matrix', '.light', '.neon', '.devil', '.purple', '.thunder', '.leaves', '.1917', '.arena', '.hacker', '.sand', '.blackpink', '.glitch', '.fire'],
            '📥 Downloader': ['.play', '.song', '.instagram', '.facebook', '.tiktok', '.video', '.ytmp4'],
            '🧩 MISC': ['.heart', '.horny', '.circle', '.lgbt', '.lolice', '.its-so-stupid', '.namecard', '.oogway', '.tweet', '.ytcomment', '.comrade', '.gay', '.glass', '.jail', '.passed', '.triggered'],
            '💻 Github': ['.git', '.github', '.sc', '.script', '.repo'],
            '🔒 Owner': ['.mode', '.autostatus', '.clearsession', '.antidelete', '.cleartmp', '.update', '.setpp', '.autoreact', '.autotyping', '.autoread']
        };

        // Construir mensagem de ajuda
        let helpMessage = `
╔═══════════════════╗
   *🧜‍♀️Sereia Bot*  
   Version: *${settings.version || '2.1.0'}*
╚═══════════════════╝

${isGroup ?
                `📋 *Comandos Habilitados para este Grupo:*\n` :
                `📋 *Todos os Comandos Disponíveis:*\n`}

`;

        // Adicionar cada categoria que tem comandos habilitados
        for (const [category, commands] of Object.entries(commandCategories)) {
            const availableInCategory = commands.filter(cmd => allAvailableCommands.includes(cmd));

            if (availableInCategory.length > 0) {
                helpMessage += `╔═══════════════════╗\n${category}:\n`;

                availableInCategory.forEach(cmd => {
                    helpMessage += `║ ➤ ${cmd}\n`;
                });

                helpMessage += `╚═══════════════════╝\n\n`;
            }
        }

        // Adicionar informações sobre configuração se for grupo
        if (isGroup) {
            const totalCommands = groupSettings.getAvailableCommands().length;
            const enabledCount = enabledCommands.length;

            helpMessage += `📊 *Status:* ${enabledCount}/${totalCommands} comandos habilitados\n\n`;
            helpMessage += `💡 *Para configurar comandos:*\n`;
            helpMessage += `• .groupmenu - Configurar comandos do grupo\n`;
            helpMessage += `• .groupmenu status - Ver status atual\n\n`;
        }

        helpMessage += `Thanks for using Sereia Bot! 🧜‍♀️`;

        // Enviar mensagem
        await sock.sendMessage(chatId, {
            text: helpMessage
        }, message ? { quoted: message } : {});

    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Erro ao carregar comandos. Tente novamente.'
        }, message ? { quoted: message } : {});
    }
}

module.exports = helpCommand;
