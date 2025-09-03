const groupSettings = require('../lib/groupSettings');
const isAdmin = require('../lib/isAdmin');

async function groupmenuCommand(sock, chatId, senderId, message, args) {
    try {
        const isGroup = chatId.endsWith('@g.us');

        if (!isGroup) {
            await sock.sendMessage(chatId, {
                text: '❌ Este comando só pode ser usado em grupos.'
            }, message ? { quoted: message } : {});
            return;
        }

        // Verificar se o usuário é admin
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isSenderAdmin && !isBotAdmin) {
            await sock.sendMessage(chatId, {
                text: '❌ Somente administradores podem usar este comando.'
            }, message ? { quoted: message } : {});
            return;
        }

        if (args.length === 0) {
            // Mostrar menu de configuração
            const groupSettings = groupSettings.getGroupSettings(chatId);
            const enabledCommands = groupSettings.enabledCommands;
            const availableCommands = groupSettings.getAvailableCommands();

            const menuText = `
🧜‍♀️ *Sereia Bot - Menu de Configuração do Grupo*

📋 *Comandos Habilitados:* ${enabledCommands.length}/${availableCommands.length}

${enabledCommands.length > 0 ?
                    `✅ *Comandos Ativos:*
${enabledCommands.map(cmd => `• ${cmd}`).join('\n')}` :
                    '❌ *Nenhum comando habilitado*'}

📝 *Comandos Disponíveis:*
• .groupmenu enable <comando> - Habilitar comando
• .groupmenu disable <comando> - Desabilitar comando
• .groupmenu list - Listar todos os comandos
• .groupmenu status - Ver status atual
• .groupmenu alias <nome> - Criar alias para o grupo
• .groupmenu reset - Resetar configurações

🧜‍♀️ *Exemplo:*
.groupmenu enable .joke
.groupmenu disable .ban
.groupmenu alias "Meu Grupo"
            `;

            await sock.sendMessage(chatId, {
                text: menuText
            }, message ? { quoted: message } : {});
            return;
        }

        const action = args[0].toLowerCase();

        switch (action) {
            case 'enable':
                if (args.length < 2) {
                    await sock.sendMessage(chatId, {
                        text: '❌ Uso: .groupmenu enable <comando>\nExemplo: .groupmenu enable .joke'
                    }, message ? { quoted: message } : {});
                    return;
                }

                const commandToEnable = args[1];
                const availableCommands = groupSettings.getAvailableCommands();

                if (!availableCommands.includes(commandToEnable)) {
                    await sock.sendMessage(chatId, {
                        text: `❌ Comando "${commandToEnable}" não existe.\nUse .groupmenu list para ver comandos disponíveis.`
                    }, message ? { quoted: message } : {});
                    return;
                }

                if (groupSettings.enableCommand(chatId, commandToEnable)) {
                    await sock.sendMessage(chatId, {
                        text: `✅ Comando "${commandToEnable}" habilitado com sucesso!`
                    }, message ? { quoted: message } : {});
                } else {
                    await sock.sendMessage(chatId, {
                        text: `⚠️ Comando "${commandToEnable}" já estava habilitado.`
                    }, message ? { quoted: message } : {});
                }
                break;

            case 'disable':
                if (args.length < 2) {
                    await sock.sendMessage(chatId, {
                        text: '❌ Uso: .groupmenu disable <comando>\nExemplo: .groupmenu disable .ban'
                    }, message ? { quoted: message } : {});
                    return;
                }

                const commandToDisable = args[1];

                if (groupSettings.disableCommand(chatId, commandToDisable)) {
                    await sock.sendMessage(chatId, {
                        text: `✅ Comando "${commandToDisable}" desabilitado com sucesso!`
                    }, message ? { quoted: message } : {});
                } else {
                    await sock.sendMessage(chatId, {
                        text: `⚠️ Comando "${commandToDisable}" não estava habilitado.`
                    }, message ? { quoted: message } : {});
                }
                break;

            case 'list':
                const allCommands = groupSettings.getAvailableCommands();
                const currentSettings = groupSettings.getGroupSettings(chatId);
                const enabledCommands = currentSettings.enabledCommands;

                const commandList = allCommands.map(cmd => {
                    const status = enabledCommands.includes(cmd) ? '✅' : '❌';
                    return `${status} ${cmd}`;
                }).join('\n');

                await sock.sendMessage(chatId, {
                    text: `📋 *Lista de Comandos Disponíveis:*\n\n${commandList}\n\n✅ = Habilitado | ❌ = Desabilitado`
                }, message ? { quoted: message } : {});
                break;

            case 'status':
                const settings = groupSettings.getGroupSettings(chatId);
                const enabledCount = settings.enabledCommands.length;
                const totalCount = groupSettings.getAvailableCommands().length;

                const statusText = `
📊 *Status do Grupo*

📋 *Comandos:* ${enabledCount}/${totalCount} habilitados
📅 *Criado em:* ${new Date(settings.createdAt).toLocaleString('pt-BR')}
🔄 *Última atualização:* ${new Date(settings.lastUpdated).toLocaleString('pt-BR')}
🏷️ *Alias:* ${settings.groupAlias || 'Nenhum'}
📝 *Nome:* ${settings.groupName || 'Não definido'}

${enabledCount > 0 ?
                        `✅ *Comandos Ativos:*
${settings.enabledCommands.map(cmd => `• ${cmd}`).join('\n')}` :
                        '❌ *Nenhum comando habilitado*'}
                `;

                await sock.sendMessage(chatId, {
                    text: statusText
                }, message ? { quoted: message } : {});
                break;



            case 'reset':
                const resetSettings = {
                    enabledCommands: [],
                    groupName: '',
                    groupAlias: '',
                    lastUpdated: new Date().toISOString()
                };

                if (groupSettings.updateGroupSettings(chatId, resetSettings)) {
                    await sock.sendMessage(chatId, {
                        text: '✅ Configurações do grupo resetadas com sucesso!\n\n⚠️ Todos os comandos foram desabilitados.'
                    }, message ? { quoted: message } : {});
                } else {
                    await sock.sendMessage(chatId, {
                        text: '❌ Erro ao resetar configurações.'
                    }, message ? { quoted: message } : {});
                }
                break;

            default:
                await sock.sendMessage(chatId, {
                    text: `❌ Ação "${action}" não reconhecida.\n\nUse .groupmenu para ver as opções disponíveis.\n\n💡 *Para gerenciar aliases, use o chat privado com o bot*`
                }, message ? { quoted: message } : {});
        }

    } catch (error) {
        console.error('Erro no comando groupmenu:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Erro interno. Tente novamente.'
        }, message ? { quoted: message } : {});
    }
}

module.exports = groupmenuCommand;
