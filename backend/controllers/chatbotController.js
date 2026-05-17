// controllers/chatbotController.js — Chatbot EduBridge Assistant
const chatbotService = require('../services/chatbotService');

// POST /api/chatbot/message — traitement d'un message utilisateur (endpoint public)
exports.sendMessage = async (req, res) => {
  try {
    const { message, lang } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Le message ne peut pas être vide.' });
    }

    const langue = lang === 'en' ? 'en' : 'fr';
    const response = chatbotService.processMessage(message.trim(), langue);

    return res.json({ success: true, data: { response } });
  } catch (error) {
    console.error('[CHATBOT] Erreur :', error.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur chatbot.' });
  }
};
