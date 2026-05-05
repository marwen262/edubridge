'use strict';

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const DIPLOMA_VERIFIER_URL =
  process.env.DIPLOMA_VERIFIER_URL || 'http://localhost:8000';

const NOMS_DIPLOMES = [
  'diplome_bac',
  'diplome_licence',
  'diplome_master',
  'attestation_bac',
  'releve_notes_bac',
];

/**
 * Envoie un fichier diplôme au microservice de vérification.
 * Retourne toujours un objet — ne lève jamais d'exception.
 */
async function verifierDiplome(cheminFichier, nomFichier) {
  try {
    if (!fs.existsSync(cheminFichier)) {
      console.warn(
        '[diplomaVerifier] Fichier introuvable, vérification ignorée :',
        cheminFichier
      );
      return { succes: false, score: null, niveau: null, raisons: [] };
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(cheminFichier), {
      filename: nomFichier,
    });

    const reponse = await axios.post(
      `${DIPLOMA_VERIFIER_URL}/api/verify`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 60000,
      }
    );

    return {
      succes: true,
      score: reponse.data.score ?? null,
      niveau: reponse.data.confidence_level ?? null,
      raisons: reponse.data.reasons ?? [],
    };
  } catch (erreur) {
    console.warn(
      '[diplomaVerifier] Microservice indisponible, vérification ignorée :',
      erreur.message
    );
    return { succes: false, score: null, niveau: null, raisons: [] };
  }
}

module.exports = { verifierDiplome, NOMS_DIPLOMES };
