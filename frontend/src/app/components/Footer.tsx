import React from 'react';
import { Link } from 'react-router';
import { GraduationCap, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#1D1D1F] text-white py-16">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-8 h-8 text-[var(--edu-blue)]" />
              <span className="text-xl font-semibold">EduBridge</span>
            </Link>
            <p className="text-[#86868B] text-sm">
              Find your path to the right institution
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4 text-[15px]">Product</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/search" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  Browse Programs
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  Find Institutions
                </Link>
              </li>
              <li>
                <Link to="/compare" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  Compare Programs
                </Link>
              </li>
            </ul>
          </div>

          {/* For Candidates */}
          <div>
            <h4 className="font-semibold mb-4 text-[15px]">For Candidates</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/signup" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/dashboard/candidate" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  My Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* For Institutions */}
          <div>
            <h4 className="font-semibold mb-4 text-[15px]">For Institutions</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/login" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  Institution Login
                </Link>
              </li>
              <li>
                <Link to="/dashboard/institution" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 text-[15px]">Company</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-[#86868B] hover:text-white text-sm transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-[#3A3A3C] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#86868B] text-sm">
            © 2026 EduBridge. All rights reserved.
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
            <option value="es">Español</option>
            <option value="de">Deutsch</option>
          </select>
        </div>
      </div>
    </footer>
  );
}
