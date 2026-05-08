import { Link } from 'react-router';
import { Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logoedubridge from '@/assets/logo/logoedubridge.png';

export function Footer() {
  const { t } = useTranslation();

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
              {t('footer.tagline')}
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold mb-4 text-[15px]">{t('footer.platform.title')}</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/search" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  {t('footer.platform.browsePrograms')}
                </Link>
              </li>
              <li>
                <Link to="/institutions" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  {t('footer.platform.findInstitution')}
                </Link>
              </li>
              <li>
                <Link to="/compare" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  {t('footer.platform.comparePrograms')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Candidates */}
          <div>
            <h4 className="font-semibold mb-4 text-[15px]">{t('footer.candidates.title')}</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/signup" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  {t('footer.candidates.createAccount')}
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  {t('footer.candidates.login')}
                </Link>
              </li>
              <li>
                <Link to="/dashboard/candidate" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  {t('footer.candidates.mySpace')}
                </Link>
              </li>
              <li>
                <Link to="/dashboard/candidatures" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  {t('footer.candidates.myApplications')}
                </Link>
              </li>
              <li>
                <Link to="/dashboard/favoris" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  {t('footer.candidates.myFavorites')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Institutions */}
          <div>
            <h4 className="font-semibold mb-4 text-[15px]">{t('footer.institutions.title')}</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/login" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  {t('footer.institutions.login')}
                </Link>
              </li>
              <li>
                <Link to="/signup" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  {t('footer.institutions.requestInvitation')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 text-[15px]">{t('footer.company.title')}</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  {t('footer.company.about')}
                </Link>
              </li>
              <li>
                <Link to="/" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  {t('footer.company.contact')}
                </Link>
              </li>
              <li>
                <Link to="/" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  {t('footer.company.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  {t('footer.company.terms')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4 text-[15px]">{t('footer.resources.title')}</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/guide" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  {t('footer.resources.candidateGuide')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-[#3A3A3C] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#86868B] text-sm">
            {t('footer.copyright')}
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a href="#" className="text-[#86868B] hover:text-white transition-colors" aria-label="Facebook">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="text-[#86868B] hover:text-white transition-colors" aria-label="Twitter">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-[#86868B] hover:text-white transition-colors" aria-label="LinkedIn">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="#" className="text-[#86868B] hover:text-white transition-colors" aria-label="Instagram">
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
