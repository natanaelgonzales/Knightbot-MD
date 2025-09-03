const fs = require('fs');
const path = require('path');

// Função para carregar configurações de grupos
function loadGroupSettings() {
    try {
        const dataPath = path.join(__dirname, '../data/groupSettings.json');
        if (!fs.existsSync(dataPath)) {
            const defaultData = {
                groups: {},
                aliases: {},
                commandPermissions: {}
            };
            fs.writeFileSync(dataPath, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        return data;
    } catch (error) {
        console.error('Erro ao carregar configurações de grupo:', error);
        return {
            groups: {},
            aliases: {},
            commandPermissions: {}
        };
    }
}

// Função para salvar configurações de grupos
function saveGroupSettings(data) {
    try {
        const dataPath = path.join(__dirname, '../data/groupSettings.json');
        const dataDir = path.dirname(dataPath);

        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Erro ao salvar configurações de grupo:', error);
        return false;
    }
}

// Função para obter configurações de um grupo específico
function getGroupSettings(chatId) {
    const data = loadGroupSettings();
    if (!data.groups[chatId]) {
        // Configuração padrão: todos os comandos bloqueados
        data.groups[chatId] = {
            enabledCommands: [],
            groupName: '',
            groupAlias: '',
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };
        saveGroupSettings(data);
    }
    return data.groups[chatId];
}

// Função para atualizar configurações de um grupo
function updateGroupSettings(chatId, settings) {
    const data = loadGroupSettings();
    data.groups[chatId] = {
        ...data.groups[chatId],
        ...settings,
        lastUpdated: new Date().toISOString()
    };
    return saveGroupSettings(data);
}

// Função para verificar se um comando está habilitado para um grupo
function isCommandEnabled(chatId, command) {
    const groupSettings = getGroupSettings(chatId);
    return groupSettings.enabledCommands.includes(command);
}

// Função para habilitar um comando para um grupo
function enableCommand(chatId, command) {
    const groupSettings = getGroupSettings(chatId);
    if (!groupSettings.enabledCommands.includes(command)) {
        groupSettings.enabledCommands.push(command);
        updateGroupSettings(chatId, groupSettings);
        return true;
    }
    return false;
}

// Função para desabilitar um comando para um grupo
function disableCommand(chatId, command) {
    const groupSettings = getGroupSettings(chatId);
    const index = groupSettings.enabledCommands.indexOf(command);
    if (index > -1) {
        groupSettings.enabledCommands.splice(index, 1);
        updateGroupSettings(chatId, groupSettings);
        return true;
    }
    return false;
}

// Função para criar alias para um grupo
function createGroupAlias(chatId, alias, groupName) {
    const data = loadGroupSettings();
    data.aliases[alias] = {
        chatId: chatId,
        groupName: groupName,
        createdAt: new Date().toISOString()
    };

    // Atualizar alias no grupo também
    const groupSettings = getGroupSettings(chatId);
    groupSettings.groupAlias = alias;
    groupSettings.groupName = groupName;
    updateGroupSettings(chatId, groupSettings);

    return saveGroupSettings(data);
}

// Função para obter chatId por alias
function getChatIdByAlias(alias) {
    const data = loadGroupSettings();
    return data.aliases[alias]?.chatId || null;
}

// Função para listar todos os grupos com aliases
function listGroupsWithAliases() {
    const data = loadGroupSettings();
    return data.aliases;
}

// Função para obter informações de um grupo por alias
function getGroupInfoByAlias(alias) {
    const data = loadGroupSettings();
    const aliasInfo = data.aliases[alias];
    if (aliasInfo) {
        const groupSettings = getGroupSettings(aliasInfo.chatId);
        return {
            ...aliasInfo,
            enabledCommands: groupSettings.enabledCommands,
            lastUpdated: groupSettings.lastUpdated
        };
    }
    return null;
}

// Função para remover alias
function removeGroupAlias(alias) {
    const data = loadGroupSettings();
    if (data.aliases[alias]) {
        const chatId = data.aliases[alias].chatId;
        delete data.aliases[alias];

        // Remover alias do grupo também
        const groupSettings = getGroupSettings(chatId);
        groupSettings.groupAlias = '';
        updateGroupSettings(chatId, groupSettings);

        return saveGroupSettings(data);
    }
    return false;
}

// Função para obter lista de comandos disponíveis
function getAvailableCommands() {
    return [
        // Comandos gerais
        '.help', '.menu', '.ping', '.alive', '.joke', '.quote', '.fact', '.weather', '.news',
        '.attp', '.lyrics', '.8ball', '.groupinfo', '.staff', '.admins', '.vv', '.trt', '.ss', '.jid',

        // Comandos de admin
        '.ban', '.unban', '.promote', '.demote', '.mute', '.unmute', '.delete', '.del', '.kick',
        '.warnings', '.warn', '.antilink', '.antibadword', '.clear', '.tag', '.tagall', '.chatbot',
        '.link', '.resetlink', '.antitag', '.welcome', '.goodbye',

        // Comandos de agendamento
        '.criarlista', '.listarlistas', '.removerlista', '.pausarlista', '.ativarlista',

        // Comandos de imagem/sticker
        '.blur', '.simage', '.sticker', '.removebg', '.remini', '.crop', '.tgsticker', '.meme',
        '.take', '.emojimix',

        // Comandos de jogo
        '.tictactoe', '.hangman', '.guess', '.trivia', '.answer', '.truth', '.dare',

        // Comandos de IA
        '.gpt', '.gemini', '.imagine', '.flux',

        // Comandos de diversão
        '.compliment', '.insult', '.flirt', '.shayari', '.goodnight', '.roseday', '.character',
        '.wasted', '.ship', '.simp', '.stupid',

        // Textmaker
        '.metallic', '.ice', '.snow', '.impressive', '.matrix', '.light', '.neon', '.devil',
        '.purple', '.thunder', '.leaves', '.1917', '.arena', '.hacker', '.sand', '.blackpink',
        '.glitch', '.fire',

        // Downloader
        '.play', '.song', '.instagram', '.facebook', '.tiktok', '.video', '.ytmp4',

        // MISC
        '.heart', '.horny', '.circle', '.lgbt', '.lolice', '.its-so-stupid', '.namecard',
        '.oogway', '.tweet', '.ytcomment', '.comrade', '.gay', '.glass', '.jail', '.passed', '.triggered',

        // Github
        '.git', '.github', '.sc', '.script', '.repo'
    ];
}

module.exports = {
    loadGroupSettings,
    saveGroupSettings,
    getGroupSettings,
    updateGroupSettings,
    isCommandEnabled,
    enableCommand,
    disableCommand,
    createGroupAlias,
    getChatIdByAlias,
    listGroupsWithAliases,
    getGroupInfoByAlias,
    removeGroupAlias,
    getAvailableCommands
};
