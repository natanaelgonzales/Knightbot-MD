const moment = require('moment-timezone');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');


async function githubCommand(sock, chatId, message) {
  try {
    await sock.sendMessage(chatId, {
      text: '❌ GitHub command has been disabled.'
    }, { quoted: message });
  } catch (error) {
    await sock.sendMessage(chatId, { text: '❌ Error executing command.' }, { quoted: message });
  }
}

module.exports = githubCommand; 
