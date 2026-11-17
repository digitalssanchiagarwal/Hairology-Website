import React, { useState } from 'react';
import { Star, CheckCircle2, ThumbsUp, MessageSquare, Filter } from 'lucide-react';
import { REVIEWS } from '../data/reviews';
import { Review } from '../types';

export const CustomerReviews: React.FC = () => {
  const [reviewsList, setReviewsList] = useState<Review[]>(REVIEWS);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [showWriteModal, setShowWriteModal] = useState(false);

  // Review form states
  const [authorName, setAuthorName] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [productPurchased, setProductPurchased] = useState('The Hairology Duo');
  const [userLocation, setUserLocation] = useState('Mumbai, Maharashtra');
  const [formSuccess, setFormSuccess] = useState(false);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !reviewContent.trim()) return;

    const newRev: Review = {
      id: `rev-${Date.now()}`,
      author: authorName.trim(),
      rating: newRating,
      date: 'Today',
      title: reviewTitle.trim() || 'Exceptional Haircare',
      content: reviewContent.trim(),
      verified: true,
      productName: productPurchased,
      location: userLocation.trim(),
      tag: 'Verified Buyer'
    };

    setReviewsList([newRev, ...reviewsList]);
    setFormSuccess(true);
    setTimeout(() => {
      setShowWriteModal(false);
      setFormSuccess(false);
      setAuthorName('');
      setReviewTitle('');
      setReviewContent('');
    }, 1500);
  };

  const filtered = filterRating === 'all'
    ? reviewsList
    : reviewsList.filter(r => r.rating === filterRating);

  return (
    <section id="reviews-section" className="py-16 lg:py-24 bg-[#FDFBF7] border-b border-[#E8DFD1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header and Aggregate Rating */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 pb-8 border-b border-[#E8DFD1]">
          <div>
            <div className="text-xs font-semibold tracking-[0.25em] text-[#8A7463] uppercase mb-2">
              REAL EXPERIENCES
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#121110]">
              Customer Reviews
            </h2>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex text-[#C5A880]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#C5A880]" />
                ))}
              </div>
              <span className="font-serif text-2xl font-bold text-[#121110] tabular-nums">
                4.9 out of 5
              </span>
              <span className="text-xs text-[#8A7463]">
                (Based on {reviewsList.length + 378} verified reviews)
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowWriteModal(true)}
            className="px-6 py-3 bg-[#121110] hover:bg-[#3D3A37] text-[#C5A880] text-xs font-bold tracking-wider uppercase rounded-xl transition-all self-start md:self-auto cursor-pointer shadow-sm"
          >
            Write a Review
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#8A7463] flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter by:
            </span>
            <button
              onClick={() => setFilterRating('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                filterRating === 'all'
                  ? 'bg-[#121110] text-[#C5A880]'
                  : 'bg-[#F3EDE2] text-[#3D3A37]'
              }`}
            >
              All Stars
            </button>
            <button
              onClick={() => setFilterRating(5)}
              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                filterRating === 5
                  ? 'bg-[#121110] text-[#C5A880]'
                  : 'bg-[#F3EDE2] text-[#3D3A37]'
              }`}
            >
              <span>5 Stars</span>
              <Star className="w-3 h-3 fill-current" />
            </button>
          </div>

          <div className="text-xs text-[#8A7463]">
            Showing {filtered.length} verified customer reviews
          </div>
        </div>

        {/* Reviews List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(rev => (
            <div
              key={rev.id}
              className="bg-white rounded-2xl border border-[#E8DFD1] p-6 flex flex-col justify-between hover:border-[#C5A880] transition-all shadow-sm"
            >
              <div>
                {/* Rating and date */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex text-[#C5A880]">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#C5A880]" />
                    ))}
                  </div>
                  <span className="text-[11px] text-[#8A7463] font-mono">{rev.date}</span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-sm text-[#121110]">{rev.author}</span>
                  {rev.verified && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Verified
                    </span>
                  )}
                </div>

                <div className="text-xs font-medium text-[#8A7463] mb-3">
                  Purchased: <strong className="text-[#121110]">{rev.productName}</strong>
                </div>

                <h4 className="font-serif text-base font-bold text-[#121110] mb-2 leading-snug">
                  "{rev.title}"
                </h4>

                <p className="text-xs text-[#3D3A37] leading-relaxed">
                  {rev.content}
                </p>
              </div>

              {rev.location && (
                <div className="mt-4 pt-3 border-t border-[#E8DFD1]/60 text-[11px] text-[#8A7463]">
                  📍 {rev.location}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Write a review modal */}
        {showWriteModal && (
          <div className="fixed inset-0 z-50 bg-[#121110]/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#FDFBF7] rounded-3xl border border-[#E8DFD1] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-[#E8DFD1] mb-6">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-[#121110]">
                    Write a Review
                  </h3>
                  <p className="text-xs text-[#8A7463] mt-0.5">
                    Share your experience with HAIROLOGY
                  </p>
                </div>
                <button
                  onClick={() => setShowWriteModal(false)}
                  className="text-sm font-bold text-[#8A7463] hover:text-[#121110]"
                >
                  ✕
                </button>
              </div>

              {formSuccess ? (
                <div className="py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif text-xl font-bold text-[#121110]">
                    Thank You for Your Review!
                  </h4>
                  <p className="text-xs text-[#3D3A37] mt-1">
                    Your verified review has been published.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[#121110] block mb-1">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={authorName}
                      onChange={e => setAuthorName(e.target.value)}
                      placeholder="e.g. Radhika Sharma"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-white outline-none focus:border-[#121110]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#121110] block mb-1">
                        Rating (Stars)
                      </label>
                      <select
                        value={newRating}
                        onChange={e => setNewRating(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#E8DFD1] bg-white outline-none"
                      >
                        <option value={5}>★★★★★ (5 Stars)</option>
                        <option value={4}>★★★★☆ (4 Stars)</option>
                        <option value={3}>★★★☆☆ (3 Stars)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#121110] block mb-1">
                        Product Used
                      </label>
                      <select
                        value={productPurchased}
                        onChange={e => setProductPurchased(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#E8DFD1] bg-white outline-none"
                      >
                        <option value="The Hairology Duo">The Hairology Duo</option>
                        <option value="Hot Water Shampoo (250 ml)">Hot Water Shampoo</option>
                        <option value="Protein Shampoo (250 ml)">Protein Shampoo</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#121110] block mb-1">
                      City / Location
                    </label>
                    <input
                      type="text"
                      value={userLocation}
                      onChange={e => setUserLocation(e.target.value)}
                      placeholder="e.g. Bandra, Mumbai"
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-[#E8DFD1] bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#121110] block mb-1">
                      Headline
                    </label>
                    <input
                      type="text"
                      value={reviewTitle}
                      onChange={e => setReviewTitle(e.target.value)}
                      placeholder="e.g. My hair feels brand new!"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#121110] block mb-1">
                      Detailed Review
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={reviewContent}
                      onChange={e => setReviewContent(e.target.value)}
                      placeholder="How did the shampoo perform with your water? Any difference in frizz or root volume?"
                      className="w-full text-xs p-3 rounded-xl border border-[#E8DFD1] bg-white outline-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowWriteModal(false)}
                      className="px-4 py-2 text-xs text-[#8A7463] hover:text-[#121110]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#121110] text-[#C5A880] text-xs font-bold tracking-wider uppercase rounded-xl hover:bg-[#3D3A37]"
                    >
                      Submit Review
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
