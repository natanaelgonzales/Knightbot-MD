async function linkCommand(sock, chatId, senderId) {
    try {
        // Check if sender is admin
        const groupMetadata = await sock.groupMetadata(chatId);
        const isAdmin = groupMetadata.participants
            .filter(p => p.admin)
            .map(p => p.id)
            .includes(senderId);

        // Check if bot is admin
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotAdmin = groupMetadata.participants
            .filter(p => p.admin)
            .map(p => p.id)
            .includes(botId);

        // if (!isAdmin) {
        //     await sock.sendMessage(chatId, { text: '❌ Apenas administradores podem usar este comando!' });
        //     return;
        // }

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: '❌ O bot deve ser administrador para obter o link do grupo!' });
            return;
        }

        // Get the current group invite code
        const inviteCode = await sock.groupInviteCode(chatId);

        // Create the invite link
        const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

        // Get group info for display
        const groupName = groupMetadata.subject;
        const memberCount = groupMetadata.participants.length;

        // Send the link with group info
        await sock.sendMessage(chatId, {
            text: `
👥 *Grupo:* ${groupName}
👉 Entre aqui: ${inviteLink}
`
        });

    } catch (error) {
        console.error('Error in link command:', error);
        await sock.sendMessage(chatId, { text: '❌ Falha ao obter o link do grupo!' });
    }
}

module.exports = linkCommand;
