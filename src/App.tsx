/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ProductDetailModule } from './components/ProductDetailModule';
import { CustomerReviews } from './components/CustomerReviews';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { FastCheckoutModal } from './components/FastCheckoutModal';
import { AdminDispatchModal } from './components/AdminDispatchModal';
import { VideoWalkthroughModal } from './components/VideoWalkthroughModal';
import { StickyMobileBar } from './components/StickyMobileBar';
import { ShopifyConnectModal } from './components/ShopifyConnectModal';

export default function App() {
  const [shopifyModalOpen, setShopifyModalOpen] = useState(false);

  useEffect(() => {
    const handleOpenShopify = () => setShopifyModalOpen(true);
    window.addEventListener('open-shopify-connect', handleOpenShopify);

    // 1. Secret Owner Portal Trigger (/owner, /founder, /founder-panel, /panel, ?founder, #founder, etc.)
    // Opens ONLY the two-step Gmail + Access Code gate for the store owner
    const checkFounderRouteAndOpen = () => {
      const pathname = decodeURIComponent(window.location.pathname).toLowerCase().replace(/\/+$/, '');
      const search = decodeURIComponent(window.location.search).toLowerCase();
      const hash = decodeURIComponent(window.location.hash).toLowerCase();

      const matchedKeywords = ['owner', 'founder', 'panel', 'admin', 'orders'];

      if (
        matchedKeywords.some(kw => pathname.includes(kw)) ||
        matchedKeywords.some(kw => search.includes(kw)) ||
        matchedKeywords.some(kw => hash.includes(kw))
      ) {
        window.dispatchEvent(new CustomEvent('open-admin-portal'));
      }
    };

    checkFounderRouteAndOpen();
    window.addEventListener('hashchange', checkFounderRouteAndOpen);
    window.addEventListener('popstate', checkFounderRouteAndOpen);

    // 2. Secret Keyboard Shortcut: Ctrl + Shift + O (or Cmd + Shift + O)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'O' || e.key === 'o' || e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('open-admin-portal'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('open-shopify-connect', handleOpenShopify);
      window.removeEventListener('hashchange', checkFounderRouteAndOpen);
      window.removeEventListener('popstate', checkFounderRouteAndOpen);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <CartProvider>
      <div className="min-h-screen bg-[#FDFBF7] text-[#121110] flex flex-col font-sans selection:bg-[#C5A880]/30 selection:text-[#121110]">
        {/* Navigation and Top Announcement */}
        <Header />

        {/* Main Content Sections */}
        <main className="flex-1">
          {/* 1. Hero Section with blended bottle image & luxury typography */}
          <HeroSection />

          {/* 2. Interactive Product Detail Module */}
          <ProductDetailModule />

          {/* 3. Customer Reviews Section with Star Breakdown & Real Testimonials */}
          <CustomerReviews />
        </main>

        {/* Footer (100% clean - No public admin or staff links visible to customers) */}
        <Footer />

        {/* Floating Controls & Modals */}
        <CartDrawer />
        <FastCheckoutModal />
        
        {/* Private Owner Orders Portal (Protected by Founder Gmail + Security Code) */}
        <AdminDispatchModal />

        <VideoWalkthroughModal />
        <StickyMobileBar />
        <ShopifyConnectModal 
          isOpen={shopifyModalOpen} 
          onClose={() => setShopifyModalOpen(false)} 
        />
      </div>
    </CartProvider>
  );
}
