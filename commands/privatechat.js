const groupSettings = require('../lib/groupSettings');
const isAdmin = require('../lib/isAdmin');

async function privatechatCommand(sock, chatId, senderId, message, args) {
    try {
        const isGroup = chatId.endsWith('@g.us');

        if (isGroup) {
            await sock.sendMessage(chatId, {
                text: '❌ Este comando só pode ser usado no chat privado com o bot.'
            }, message ? { quoted: message } : {});
            return;
        }

        if (args.length === 0) {
            // Mostrar menu principal do chat privado
            const groupsWithAliases = groupSettings.listGroupsWithAliases();
            const groupList = Object.keys(groupsWithAliases);

            const menuText = `
🧜‍♀️ *Sereia Bot - Chat Privado*

📋 *Grupos Disponíveis:* ${groupList.length}

${groupList.length > 0 ?
                    `📝 *Lista de Grupos:*
${groupList.map(alias => {
                        const info = groupsWithAliases[alias];
                        return `• ${alias} - ${info.groupName}`;
                    }).join('\n')}` :
                    '❌ *Nenhum grupo configurado*'}

📝 *Comandos Disponíveis:*
• .privatechat list - Listar todos os grupos
• .privatechat info <alias> - Informações do grupo
• .privatechat send <alias> <mensagem> - Enviar mensagem para grupo
• .privatechat schedule <alias> <dia> <hora> [marcar] <template> - Agendar mensagem
• .privatechat commands <alias> - Ver comandos habilitados
• .privatechat enable <alias> <comando> - Habilitar comando
• .privatechat disable <alias> <comando> - Desabilitar comando

🏷️ *Gerenciamento de Aliases:*
• .privatechat createalias <chatId> <alias> - Criar alias para grupo
• .privatechat removealias <alias> - Remover alias
• .privatechat groups - Listar grupos disponíveis para alias

🧜‍♀️ *Exemplos:*
.privatechat send "Meu Grupo" Olá pessoal!
.privatechat schedule "Meu Grupo" quarta 12:00 Lembrete: Reunião às {hora}
.privatechat schedule "Meu Grupo" quarta 12:00 marcar Lembrete: Reunião às {hora}
.privatechat enable "Meu Grupo" .joke
.privatechat createalias 120363123456789012@g.us "Meu Grupo"
            `;

            await sock.sendMessage(chatId, {
                text: menuText
            }, message ? { quoted: message } : {});
            return;
        }

        const action = args[0].toLowerCase();

        switch (action) {
            case 'list':
                const groups = groupSettings.listGroupsWithAliases();
                const groupKeys = Object.keys(groups);

                if (groupKeys.length === 0) {
                    await sock.sendMessage(chatId, {
                        text: '❌ Nenhum grupo configurado com alias.'
                    }, message ? { quoted: message } : {});
                    return;
                }

                const listText = `
📋 *Grupos Configurados:* ${groupKeys.length}

${groupKeys.map(alias => {
                    const info = groups[alias];
                    const groupInfo = groupSettings.getGroupInfoByAlias(alias);
                    const enabledCount = groupInfo?.enabledCommands?.length || 0;
                    return `🏷️ *${alias}*
📝 Nome: ${info.groupName}
✅ Comandos: ${enabledCount} habilitados
📅 Criado: ${new Date(info.createdAt).toLocaleDateString('pt-BR')}`;
                }).join('\n\n')}
                `;

                await sock.sendMessage(chatId, {
                    text: listText
                }, message ? { quoted: message } : {});
                break;

            case 'info':
                if (args.length < 2) {
                    await sock.sendMessage(chatId, {
                        text: '❌ Uso: .privatechat info <alias>\nExemplo: .privatechat info "Meu Grupo"'
                    }, message ? { quoted: message } : {});
                    return;
                }

                const alias = args.slice(1).join(' ');
                const groupInfo = groupSettings.getGroupInfoByAlias(alias);

                if (!groupInfo) {
                    await sock.sendMessage(chatId, {
                        text: `❌ Alias "${alias}" não encontrado.`
                    }, message ? { quoted: message } : {});
                    return;
                }

                const infoText = `
📊 *Informações do Grupo*

🏷️ *Alias:* ${alias}
📝 *Nome:* ${groupInfo.groupName}
🆔 *ID:* ${groupInfo.chatId}
✅ *Comandos Habilitados:* ${groupInfo.enabledCommands?.length || 0}
📅 *Criado em:* ${new Date(groupInfo.createdAt).toLocaleString('pt-BR')}
🔄 *Última atualização:* ${new Date(groupInfo.lastUpdated).toLocaleString('pt-BR')}

${groupInfo.enabledCommands?.length > 0 ?
                        `✅ *Comandos Ativos:*
${groupInfo.enabledCommands.map(cmd => `• ${cmd}`).join('\n')}` :
                        '❌ *Nenhum comando habilitado*'}
                `;

                await sock.sendMessage(chatId, {
                    text: infoText
                }, message ? { quoted: message } : {});
                break;

            case 'send':
                if (args.length < 3) {
                    await sock.sendMessage(chatId, {
                        text: '❌ Uso: .privatechat send <alias> <mensagem>\nExemplo: .privatechat send "Meu Grupo" Olá pessoal!'
                    }, message ? { quoted: message } : {});
                    return;
                }

                const sendAlias = args[1];
                const messageText = args.slice(2).join(' ');
                const targetChatId = groupSettings.getChatIdByAlias(sendAlias);

                if (!targetChatId) {
                    await sock.sendMessage(chatId, {
                        text: `❌ Alias "${sendAlias}" não encontrado.`
                    }, message ? { quoted: message } : {});
                    return;
                }

                try {
                    await sock.sendMessage(targetChatId, {
                        text: `📨 *Mensagem do Administrador*\n\n${messageText}`
                    });

                    await sock.sendMessage(chatId, {
                        text: `✅ Mensagem enviada com sucesso para "${sendAlias}"!`
                    }, message ? { quoted: message } : {});
                } catch (error) {
                    console.error('Erro ao enviar mensagem:', error);
                    await sock.sendMessage(chatId, {
                        text: '❌ Erro ao enviar mensagem. Verifique se o bot ainda está no grupo.'
                    }, message ? { quoted: message } : {});
                }
                break;

            case 'schedule':
                if (args.length < 5) {
                    await sock.sendMessage(chatId, {
                        text: '❌ Uso: .privatechat schedule <alias> <dia> <hora> [marcar] <template>\nExemplo: .privatechat schedule "Meu Grupo" quarta 12:00 Lembrete: Reunião às {hora}\nExemplo com marcar: .privatechat schedule "Meu Grupo" quarta 12:00 marcar Lembrete: Reunião às {hora}'
                    }, message ? { quoted: message } : {});
                    return;
                }

                const scheduleAlias = args[1];
                const day = args[2];
                const time = args[3];
                const templateParts = args.slice(4);

                // Verificar se tem o parâmetro "marcar"
                const shouldMention = templateParts[0] === 'marcar';
                const template = shouldMention ? templateParts.slice(1).join(' ') : templateParts.join(' ');

                const scheduleChatId = groupSettings.getChatIdByAlias(scheduleAlias);

                if (!scheduleChatId) {
                    await sock.sendMessage(chatId, {
                        text: `❌ Alias "${scheduleAlias}" não encontrado.`
                    }, message ? { quoted: message } : {});
                    return;
                }

                // Validar se o chatId é válido
                if (!scheduleChatId.endsWith('@g.us')) {
                    await sock.sendMessage(chatId, {
                        text: `❌ ChatId inválido para "${scheduleAlias}".`
                    }, message ? { quoted: message } : {});
                    return;
                }

                // Verificar se o comando .criarlista está habilitado
                // if (!groupSettings.isCommandEnabled(scheduleChatId, '.criarlista')) {
                //     await sock.sendMessage(chatId, {
                //         text: `❌ Comando .criarlista não está habilitado para "${scheduleAlias}".\nUse: .privatechat enable "${scheduleAlias}" .criarlista`
                //     }, message ? { quoted: message } : {});
                //     return;
                // }

                // Simular comando .criarlista
                try {
                    const criarlistaCommand = require('./criarlista');
                    const mockMessage = {
                        key: {
                            participant: senderId,
                            remoteJid: scheduleChatId
                        },
                        message: {
                            conversation: `.criarlista ${day} ${time} ${template}`
                        }
                    };

                    // Criar array de argumentos corretos
                    const criarlistaArgs = [day, time];
                    if (shouldMention) {
                        criarlistaArgs.push('marcar');
                    }
                    criarlistaArgs.push(template);

                    await criarlistaCommand(sock, scheduleChatId, senderId, mockMessage, criarlistaArgs, true);

                    await sock.sendMessage(chatId, {
                        text: `✅ Agendamento criado com sucesso para "${scheduleAlias}"!`
                    }, message ? { quoted: message } : {});
                } catch (error) {
                    console.error('Erro ao criar agendamento:', error);
                    await sock.sendMessage(chatId, {
                        text: `❌ Erro ao criar agendamento para "${scheduleAlias}". Verifique se o bot está no grupo e se os parâmetros estão corretos.`
                    }, message ? { quoted: message } : {});
                }
                break;

            case 'commands':
                if (args.length < 2) {
                    await sock.sendMessage(chatId, {
                        text: '❌ Uso: .privatechat commands <alias>\nExemplo: .privatechat commands "Meu Grupo"'
                    }, message ? { quoted: message } : {});
                    return;
                }

                const commandsAlias = args[1];
                const commandsInfo = groupSettings.getGroupInfoByAlias(commandsAlias);

                if (!commandsInfo) {
                    await sock.sendMessage(chatId, {
                        text: `❌ Alias "${commandsAlias}" não encontrado.`
                    }, message ? { quoted: message } : {});
                    return;
                }

                const allCommands = groupSettings.getAvailableCommands();
                const enabledCommands = commandsInfo.enabledCommands || [];

                const commandsList = allCommands.map(cmd => {
                    const status = enabledCommands.includes(cmd) ? '✅' : '❌';
                    return `${status} ${cmd}`;
                }).join('\n');

                await sock.sendMessage(chatId, {
                    text: `📋 *Comandos para "${commandsAlias}":*\n\n${commandsList}\n\n✅ = Habilitado | ❌ = Desabilitado`
                }, message ? { quoted: message } : {});
                break;

            case 'enable':
                if (args.length < 3) {
                    await sock.sendMessage(chatId, {
                        text: '❌ Uso: .privatechat enable <alias> <comando>\nExemplo: .privatechat enable "Meu Grupo" .joke'
                    }, message ? { quoted: message } : {});
                    return;
                }

                const enableAlias = args[1];
                const commandToEnable = args[2];
                const enableChatId = groupSettings.getChatIdByAlias(enableAlias);

                if (!enableChatId) {
                    await sock.sendMessage(chatId, {
                        text: `❌ Alias "${enableAlias}" não encontrado.`
                    }, message ? { quoted: message } : {});
                    return;
                }

                const availableCommands = groupSettings.getAvailableCommands();
                if (!availableCommands.includes(commandToEnable)) {
                    await sock.sendMessage(chatId, {
                        text: `❌ Comando "${commandToEnable}" não existe.`
                    }, message ? { quoted: message } : {});
                    return;
                }

                if (groupSettings.enableCommand(enableChatId, commandToEnable)) {
                    await sock.sendMessage(chatId, {
                        text: `✅ Comando "${commandToEnable}" habilitado com sucesso para "${enableAlias}"!`
                    }, message ? { quoted: message } : {});
                } else {
                    await sock.sendMessage(chatId, {
                        text: `⚠️ Comando "${commandToEnable}" já estava habilitado para "${enableAlias}".`
                    }, message ? { quoted: message } : {});
                }
                break;

            case 'disable':
                if (args.length < 3) {
                    await sock.sendMessage(chatId, {
                        text: '❌ Uso: .privatechat disable <alias> <comando>\nExemplo: .privatechat disable "Meu Grupo" .ban'
                    }, message ? { quoted: message } : {});
                    return;
                }

                const disableAlias = args[1];
                const commandToDisable = args[2];
                const disableChatId = groupSettings.getChatIdByAlias(disableAlias);

                if (!disableChatId) {
                    await sock.sendMessage(chatId, {
                        text: `❌ Alias "${disableAlias}" não encontrado.`
                    }, message ? { quoted: message } : {});
                    return;
                }

                if (groupSettings.disableCommand(disableChatId, commandToDisable)) {
                    await sock.sendMessage(chatId, {
                        text: `✅ Comando "${commandToDisable}" desabilitado com sucesso para "${disableAlias}"!`
                    }, message ? { quoted: message } : {});
                } else {
                    await sock.sendMessage(chatId, {
                        text: `⚠️ Comando "${commandToDisable}" não estava habilitado para "${disableAlias}".`
                    }, message ? { quoted: message } : {});
                }
                break;

            case 'createalias':
                if (args.length < 3) {
                    await sock.sendMessage(chatId, {
                        text: '❌ Uso: .privatechat createalias <chatId> <alias>\nExemplo: .privatechat createalias 120363123456789012@g.us "Meu Grupo"'
                    }, message ? { quoted: message } : {});
                    return;
                }

                const groupChatId = args[1];
                const newAlias = args.slice(2).join(' ');

                // Verificar se o chatId é válido (deve terminar com @g.us)
                if (!groupChatId.endsWith('@g.us')) {
                    await sock.sendMessage(chatId, {
                        text: '❌ ChatId inválido. Deve ser um ID de grupo (terminar com @g.us)'
                    }, message ? { quoted: message } : {});
                    return;
                }

                // Verificar se o alias já existe
                if (groupSettings.getChatIdByAlias(newAlias)) {
                    await sock.sendMessage(chatId, {
                        text: `❌ Alias "${newAlias}" já existe.`
                    }, message ? { quoted: message } : {});
                    return;
                }

                try {
                    // Tentar obter informações do grupo
                    const groupMetadata = await sock.groupMetadata(groupChatId);
                    const groupName = groupMetadata.subject;

                    if (groupSettings.createGroupAlias(groupChatId, newAlias, groupName)) {
                        await sock.sendMessage(chatId, {
                            text: `✅ Alias criado com sucesso!\n\n🏷️ *Alias:* ${newAlias}\n📝 *Nome do grupo:* ${groupName}\n🆔 *ID:* ${groupChatId}\n\nAgora você pode usar este alias para gerenciar o grupo.`
                        }, message ? { quoted: message } : {});
                    } else {
                        await sock.sendMessage(chatId, {
                            text: '❌ Erro ao criar alias. Tente novamente.'
                        }, message ? { quoted: message } : {});
                    }
                } catch (error) {
                    console.error('Erro ao obter metadados do grupo:', error);
                    await sock.sendMessage(chatId, {
                        text: '❌ Erro ao obter informações do grupo. Verifique se o bot está no grupo e se o ID está correto.'
                    }, message ? { quoted: message } : {});
                }
                break;

            case 'removealias':
                if (args.length < 2) {
                    await sock.sendMessage(chatId, {
                        text: '❌ Uso: .privatechat removealias <alias>\nExemplo: .privatechat removealias "Meu Grupo"'
                    }, message ? { quoted: message } : {});
                    return;
                }

                const aliasToRemove = args.slice(1).join(' ');

                if (groupSettings.removeGroupAlias(aliasToRemove)) {
                    await sock.sendMessage(chatId, {
                        text: `✅ Alias "${aliasToRemove}" removido com sucesso!`
                    }, message ? { quoted: message } : {});
                } else {
                    await sock.sendMessage(chatId, {
                        text: `❌ Alias "${aliasToRemove}" não encontrado.`
                    }, message ? { quoted: message } : {});
                }
                break;

            case 'groups':
                try {
                    // Obter lista de grupos onde o bot está
                    const groups = await sock.groupFetchAllParticipating();
                    const groupList = Object.values(groups).map(group => {
                        return `🆔 *${group.id}*\n📝 *Nome:* ${group.subject}\n👥 *Membros:* ${group.participants.length}`;
                    }).join('\n\n');

                    if (groupList) {
                        await sock.sendMessage(chatId, {
                            text: `📋 *Grupos Disponíveis:*\n\n${groupList}\n\n💡 *Use o ID do grupo com .privatechat createalias para criar um alias*`
                        }, message ? { quoted: message } : {});
                    } else {
                        await sock.sendMessage(chatId, {
                            text: '❌ Nenhum grupo encontrado onde o bot está presente.'
                        }, message ? { quoted: message } : {});
                    }
                } catch (error) {
                    console.error('Erro ao obter grupos:', error);
                    await sock.sendMessage(chatId, {
                        text: '❌ Erro ao obter lista de grupos.'
                    }, message ? { quoted: message } : {});
                }
                break;

            default:
                await sock.sendMessage(chatId, {
                    text: `❌ Ação "${action}" não reconhecida.\n\nUse .privatechat para ver as opções disponíveis.`
                }, message ? { quoted: message } : {});
        }

    } catch (error) {
        console.error('Erro no comando privatechat:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Erro interno. Tente novamente.'
        }, message ? { quoted: message } : {});
    }
}

module.exports = privatechatCommand;
