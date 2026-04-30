import React from 'react';
import { Link } from 'react-router';
import { Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import logoedubridge from '@/assets/logo/logoedubridge.png';

export function Footer() {
  return (
    <footer className="bg-[#1D1D1F] text-white py-16">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img
                src={logoedubridge}
                alt="EduBridge"
                className="h-14 w-auto drop-shadow-sm"
              />
            </Link>
            <p className="text-[#86868B] text-sm">
              Trouvez votre voie vers l'institution idéale
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4 text-[15px]">Plateforme</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/search" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  Parcourir les programmes
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  Trouver un institut
                </Link>
              </li>
              <li>
                <Link to="/compare" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  Comparer les programmes
                </Link>
              </li>
            </ul>
          </div>

          {/* For Candidates */}
          <div>
            <h4 className="font-semibold mb-4 text-[15px]">Candidats</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/signup" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  Créer un compte
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  Se connecter
                </Link>
              </li>
              <li>
                <Link to="/dashboard/candidate" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  Mon espace
                </Link>
              </li>
            </ul>
          </div>

          {/* For Institutions */}
          <div>
            <h4 className="font-semibold mb-4 text-[15px]">Instituts</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/login" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  Connexion institut
                </Link>
              </li>
              <li>
                <Link to="/dashboard/institution" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  Tableau de bord
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 text-[15px]">Entreprise</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  À propos
                </a>
              </li>
              <li>
                <a href="#" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  Politique de confidentialité
                </a>
              </li>
              <li>
                <a href="#" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  Conditions d'utilisation
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4 text-[15px]">Ressources</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/guide" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  Guide candidat
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-[#3A3A3C] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#86868B] text-sm">
            © 2026 EduBridge. Tous droits réservés.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-[#86868B] hover:text-white transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-[#86868B] hover:text-white transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-[#86868B] hover:text-white transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-[#86868B] hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
          </div>

          {/* Language Switcher */}
          <select className="bg-transparent border border-[#3A3A3C] rounded-lg px-4 py-2 text-sm text-[#86868B] focus:outline-none focus:border-[var(--edu-blue)]">
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </div>
      </div>
    </footer>
  );
}
