import React, { useState } from 'react';
import { ArrowRight, Check, ShieldCheck, Mail, Lock } from 'lucide-react';
import { ADMIN_EMAIL, USER_LOGO_IMAGE } from '../data/products';
import { useCart } from '../context/CartContext';

export const Footer: React.FC = () => {
  const { openVideoModal } = useCart();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribed(true);
    setNewsletterEmail('');
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#F3EDE2] text-[#121110] border-t border-[#E8DFD1]">
      
      {/* 1. Newsletter Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 border-b border-[#E8DFD1]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#121110] mb-2">
              Get tangled up with us!
            </h3>
            <p className="text-xs sm:text-sm text-[#3D3A37] max-w-xl leading-relaxed">
              Join the Hairology circle as a co-creator and stay ahead of the curve, right from our trichology lab concoctions to exclusive launches, secret offers, and wash-day masterclasses.
            </p>
          </div>

          <div className="lg:col-span-5">
            {subscribed ? (
              <div className="bg-[#FDFBF7] p-3 rounded-xl border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Welcome to the Hairology Circle. You'll receive lab updates and early launch access!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  placeholder="Enter Your Email Address"
                  className="flex-1 bg-[#FDFBF7] text-xs px-4 py-3 rounded-xl border border-[#E8DFD1] outline-none focus:border-[#121110]"
                />
                <button
                  type="submit"
                  className="px-5 py-3 bg-[#121110] text-[#C5A880] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#3D3A37] transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <span>Join</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-4">
            <div className="inline-block">
              <img
                src={USER_LOGO_IMAGE}
                alt="HAIROLOGY Logo"
                className="h-10 sm:h-12 w-auto object-contain bg-[#121110] p-1.5 rounded-xl border border-[#C5A880]/30 shadow-md"
              />
            </div>
            <div className="font-serif italic text-lg text-[#8A7463]">
              “YOU'VE GOT HAIROLOGY. WE'VE GOT YOU.”
            </div>
            <p className="text-xs text-[#3D3A37] leading-relaxed max-w-sm">
              Haute-beauté D2C haircare engineered for Indian water realities. Neutralizing heavy metal carbonates and reconstructing keratin tensile strength.
            </p>

            <div className="space-y-1 pt-2 text-xs text-[#3D3A37]">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Team HAIROLOGY Care: <strong>{ADMIN_EMAIL}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 space-y-3">
            <div className="text-xs font-bold tracking-widest uppercase text-[#121110]">
              BRAND
            </div>
            <ul className="text-xs space-y-2 text-[#3D3A37]">
              <li>
                <button onClick={() => scrollToSection('products-showcase')} className="hover:text-[#121110]">
                  Shop 3 Formulations
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('products-showcase')} className="hover:text-[#121110]">
                  The Duo Routine
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('science-section')} className="hover:text-[#121110]">
                  The Science
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('results-section')} className="hover:text-[#121110]">
                  Clinical Proof
                </button>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="md:col-span-3 space-y-3">
            <div className="text-xs font-bold tracking-widest uppercase text-[#121110]">
              SUPPORT
            </div>
            <ul className="text-xs space-y-2 text-[#3D3A37]">
              <li>
                <button onClick={() => scrollToSection('products-showcase')} className="hover:text-[#121110]">
                  FAQs & Usage Rituals
                </button>
              </li>
              <li>
                <span className="hover:text-[#121110]">Returns & Exchanges (14-Day Guarantee)</span>
              </li>
              <li>
                <span className="hover:text-[#121110]">Terms & Conditions</span>
              </li>
              <li>
                <span className="hover:text-[#121110]">Privacy Policy</span>
              </li>
              <li>
                <button onClick={openVideoModal} className="hover:text-[#121110]">
                  Watch Product Walkthrough Film
                </button>
              </li>
            </ul>
          </div>

          {/* Regulatory & Lab Address */}
          <div className="md:col-span-3 space-y-3">
            <div className="text-xs font-bold tracking-widest uppercase text-[#121110]">
              LABORATORY & REGULATORY
            </div>
            <div className="text-xs text-[#3D3A37] leading-relaxed space-y-2">
              <div>
                <strong>HAIROLOGY HAUTE-BEAUTÉ CONSUMER VENTURES PVT. LTD.</strong>
              </div>
              <div>
                Manufacturing Lab: Plot No. 4, Sector 6A, IIE SIDCUL, Haridwar, Uttarakhand 249403, India.
              </div>
              <div className="text-[11px] text-[#8A7463]">
                Country of Origin: India • ISO 9001 & GMP Certified
              </div>
              <div className="pt-2 text-[11px] font-mono text-[#8A7463]">
                Customer Care: Team HAIROLOGY • support@hairology.in
              </div>
            </div>
          </div>

        </div>

        {/* 3. Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#E8DFD1] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8A7463]">
          <div>
            <span>© {new Date().getFullYear()} HAIROLOGY. All rights reserved. Haute-Beauté D2C Haircare.</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] uppercase tracking-wider">
            <span>NO SULPHATES</span>
            <span>•</span>
            <span>NO SILICONES</span>
            <span>•</span>
            <span>100% VEGAN</span>
            <span>•</span>
            <span>CRUELTY FREE</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
