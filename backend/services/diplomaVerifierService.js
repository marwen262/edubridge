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
 *
 * Réponse enrichie (V7) :
 *   { succes, score, niveau, raisons, subscores: { cf, struct, vis } }
 *   - cf     : critical_fields_score  (identité + données académiques)
 *   - struct : structure_score         (mise en page officielle)
 *   - vis    : visual_authenticity_score (signature, cachet)
 */
async function verifierDiplome(cheminFichier, nomFichier) {
  try {
    if (!fs.existsSync(cheminFichier)) {
      console.warn(
        '[diplomaVerifier] Fichier introuvable, vérification ignorée :',
        cheminFichier
      );
      return { succes: false, score: null, niveau: null, raisons: [], subscores: null };
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
        timeout: 150000,
      }
    );

    const data = reponse.data;
    const v7 = data.v7 ?? null;

    // Extraire les 4 sous-scores depuis le payload V7
    let subscores = null;
    if (v7 && v7.subscores) {
      subscores = {
        cf:     v7.subscores.critical_fields_score     ?? null,
        struct: v7.subscores.structure_score            ?? null,
        vis:    v7.subscores.visual_authenticity_score  ?? null,
        // fraud_score depuis le module tampering (0=aucune anomalie, 100=très suspect)
        fraud:  v7.tampering?.fraud_score               ?? null,
      };
    }

    return {
      succes: true,
      score:  data.score ?? null,
      niveau: data.confidence_level ?? null,
      raisons: data.reasons ?? [],
      subscores,
    };
  } catch (erreur) {
    console.warn(
      '[diplomaVerifier] Microservice indisponible, vérification ignorée :',
      erreur.message
    );
    return { succes: false, score: null, niveau: null, raisons: [], subscores: null };
  }
}

module.exports = { verifierDiplome, NOMS_DIPLOMES };
