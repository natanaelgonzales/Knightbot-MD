const isAdmin = require('../lib/isAdmin');  // Move isAdmin to helpers
async function tagAllCommand(sock, chatId, senderId, messageText) {
    try {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isSenderAdmin && !isBotAdmin) {
            await sock.sendMessage(chatId, {
                text: 'Only admins can use the .tagall command.'
            });
            return;
        }

        // Get group metadata
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants;

        if (!participants || participants.length === 0) {
            await sock.sendMessage(chatId, { text: 'No participants found in the group.' });
            return;
        }

        // Copy message and resend tagging all members
        let message_prefix = '🔊 *MENSAGEM:*\n\n';

        // Use the messageText parameter instead of the message object
        const finalMessage = messageText ? message_prefix + messageText : message_prefix + 'Mensagem para todos!';

        // Send message with mentions
        await sock.sendMessage(chatId, {
            text: finalMessage,
            mentions: participants.map(p => p.id)
        });

    } catch (error) {
        console.error('Error in tagall command:', error);
        await sock.sendMessage(chatId, { text: 'Failed to tag all members.' });
    }
}

module.exports = tagAllCommand;  // Export directly
