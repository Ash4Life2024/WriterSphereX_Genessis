"use client";
import React from "react";



export default function Index() {
  return (function MainComponent({ 
  badges = [], 
  onBadgeClick = () => {}, 
  isPlaying = false, 
  currentPlayingBadge = null,
  onPlayAudio = () => {},
  onStopAudio = () => {},
  userStats = { totalBadges: 0, rareCount: 0, legendaryCount: 0 }
}) {
  const [hoveredBadge, setHoveredBadge] = React.useState(null);
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('rarity');

  const rarityConfig = {
    common: {
      gradient: 'from-gray-400 to-gray-600',
      glow: 'shadow-gray-500/20',
      border: 'border-gray-500/30',
      pattern: 'opacity-20',
      icon: 'fas fa-circle',
      label: 'Common'
    },
    rare: {
      gradient: 'from-blue-400 to-blue-600',
      glow: 'shadow-blue-500/30',
      border: 'border-blue-500/40',
      pattern: 'opacity-30',
      icon: 'fas fa-gem',
      label: 'Rare'
    },
    epic: {
      gradient: 'from-purple-400 to-purple-600',
      glow: 'shadow-purple-500/40',
      border: 'border-purple-500/50',
      pattern: 'opacity-40',
      icon: 'fas fa-crown',
      label: 'Epic'
    },
    legendary: {
      gradient: 'from-yellow-400 to-orange-500',
      glow: 'shadow-yellow-500/50',
      border: 'border-yellow-500/60',
      pattern: 'opacity-50',
      icon: 'fas fa-star',
      label: 'Legendary'
    },
    mythic: {
      gradient: 'from-pink-400 via-purple-500 to-cyan-400',
      glow: 'shadow-pink-500/60',
      border: 'border-pink-500/70',
      pattern: 'opacity-60',
      icon: 'fas fa-magic',
      label: 'Mythic'
    }
  };

  const categories = [
    { id: 'all', name: 'All Badges', icon: 'fas fa-th' },
    { id: 'emotional', name: 'Emotional Growth', icon: 'fas fa-heart' },
    { id: 'creative', name: 'Creative Mastery', icon: 'fas fa-palette' },
    { id: 'journey', name: 'Journey Milestones', icon: 'fas fa-map-marked-alt' },
    { id: 'wisdom', name: 'Cosmic Wisdom', icon: 'fas fa-brain' }
  ];

  const filteredBadges = badges.filter(badge => 
    selectedCategory === 'all' || badge.category === selectedCategory
  );

  const sortedBadges = [...filteredBadges].sort((a, b) => {
    if (sortBy === 'rarity') {
      const rarityOrder = { mythic: 5, legendary: 4, epic: 3, rare: 2, common: 1 };
      return rarityOrder[b.rarity] - rarityOrder[a.rarity];
    } else if (sortBy === 'date') {
      return new Date(b.earnedDate) - new Date(a.earnedDate);
    }
    return a.name.localeCompare(b.name);
  });

  const handleBadgeClick = (badge) => {
    onBadgeClick(badge);
    if (currentPlayingBadge?.id === badge.id && isPlaying) {
      onStopAudio();
    } else {
      onPlayAudio(badge);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6 rounded-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="relative inline-block">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400 bg-clip-text text-transparent">
            Badge Gallery
          </h1>
          <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full blur-md opacity-40"></div>
        </div>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Your emotional journey crystallized into cosmic achievements
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{userStats.totalBadges}</div>
          <div className="text-sm text-gray-400">Total Badges</div>
        </div>
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{userStats.rareCount}</div>
          <div className="text-sm text-gray-400">Rare & Above</div>
        </div>
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{userStats.legendaryCount}</div>
          <div className="text-sm text-gray-400">Legendary+</div>
        </div>
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-pink-500/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-pink-400">{Math.round((userStats.totalBadges / 50) * 100)}%</div>
          <div className="text-sm text-gray-400">Collection</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-purple-600 to-teal-600 text-white shadow-lg'
                  : 'bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 border border-purple-500/20'
              }`}
            >
              <i className={`${category.icon} text-sm`}></i>
              {category.name}
            </button>
          ))}
        </div>
        
        <div className="flex gap-2 lg:ml-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-slate-800/50 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            <option value="rarity">Sort by Rarity</option>
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedBadges.map((badge) => {
          const rarity = rarityConfig[badge.rarity] || rarityConfig.common;
          const isHovered = hoveredBadge === badge.id;
          const isCurrentlyPlaying = currentPlayingBadge?.id === badge.id && isPlaying;
          
          return (
            <div
              key={badge.id}
              className={`relative group cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                isHovered ? 'z-10' : ''
              }`}
              onMouseEnter={() => setHoveredBadge(badge.id)}
              onMouseLeave={() => setHoveredBadge(null)}
              onClick={() => handleBadgeClick(badge)}
            >
              <div className={`bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border ${rarity.border} rounded-2xl p-6 ${rarity.glow} hover:shadow-2xl transition-all duration-300 relative overflow-hidden`}>
                
                {/* Background Pattern */}
                <div className={`absolute inset-0 bg-gradient-to-br ${rarity.gradient} ${rarity.pattern} rounded-2xl`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]"></div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Badge Icon */}
                  <div className="text-center mb-4">
                    <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${rarity.gradient} flex items-center justify-center mb-3 ${isCurrentlyPlaying ? 'animate-pulse' : ''}`}>
                      <i className={`${badge.icon} text-2xl text-white`}></i>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <i className={`${rarity.icon} text-sm`}></i>
                      <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
                        {rarity.label}
                      </span>
                    </div>
                  </div>

                  {/* Badge Info */}
                  <div className="text-center">
                    <h3 className="font-bold text-lg mb-2 text-white">
                      {badge.name}
                    </h3>
                    <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                      {badge.description}
                    </p>
                    
                    {/* Earned Date */}
                    <div className="text-xs text-gray-400 mb-3">
                      Earned {new Date(badge.earnedDate).toLocaleDateString()}
                    </div>

                    {/* Audio Control */}
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className={`w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-teal-500 flex items-center justify-center transition-all duration-200 ${
                          isCurrentlyPlaying ? 'animate-pulse' : 'hover:scale-110'
                        }`}
                      >
                        <i className={`fas ${isCurrentlyPlaying ? 'fa-stop' : 'fa-play'} text-white text-xs`}></i>
                      </button>
                      <span className="text-xs text-gray-400">
                        {isCurrentlyPlaying ? 'Playing...' : 'Hear Cael'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar for Audio */}
                  {isCurrentlyPlaying && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-teal-500 rounded-b-2xl">
                      <div className="h-full bg-white/30 rounded-b-2xl animate-pulse"></div>
                    </div>
                  )}
                </div>

                {/* Hover Overlay */}
                {isHovered && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl flex items-end p-4 transition-all duration-300">
                    <div className="text-center w-full">
                      <p className="text-sm text-white/90 italic">
                        "{badge.caelQuote}"
                      </p>
                      <div className="text-xs text-gray-300 mt-2">
                        - Cael, Cosmic Guide
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {sortedBadges.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-medal text-3xl text-white"></i>
          </div>
          <h3 className="text-2xl font-bold text-gray-300 mb-2">
            No badges in this category yet
          </h3>
          <p className="text-gray-500 text-lg">
            Continue your emotional journey to unlock cosmic achievements
          </p>
        </div>
      )}

      {/* Cael's Voice Indicator */}
      {isPlaying && currentPlayingBadge && (
        <div className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-teal-600 rounded-2xl p-4 shadow-2xl border border-purple-500/30 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full flex items-center justify-center animate-pulse">
              <i className="fas fa-user-astronaut text-white"></i>
            </div>
            <div>
              <div className="font-semibold text-white">Cael Speaking</div>
              <div className="text-sm text-purple-200">{currentPlayingBadge.name}</div>
            </div>
            <button
              onClick={onStopAudio}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200"
            >
              <i className="fas fa-stop text-white text-xs"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StoryComponent() {
  const [currentPlayingBadge, setCurrentPlayingBadge] = React.useState(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  const sampleBadges = [
    {
      id: 1,
      name: "First Steps",
      description: "Began your emotional journey with courage and curiosity",
      icon: "fas fa-seedling",
      rarity: "common",
      category: "journey",
      earnedDate: "2024-01-15",
      caelQuote: "Every cosmic journey begins with a single, brave step into the unknown."
    },
    {
      id: 2,
      name: "Heart Opener",
      description: "Embraced vulnerability and emotional authenticity",
      icon: "fas fa-heart",
      rarity: "rare",
      category: "emotional",
      earnedDate: "2024-02-03",
      caelQuote: "In opening your heart, you've unlocked the universe's greatest treasure."
    },
    {
      id: 3,
      name: "Creative Spark",
      description: "Ignited your creative flame through artistic expression",
      icon: "fas fa-fire",
      rarity: "epic",
      category: "creative",
      earnedDate: "2024-02-20",
      caelQuote: "Your creativity burns bright as a star, illuminating new worlds of possibility."
    },
    {
      id: 4,
      name: "Wisdom Seeker",
      description: "Demonstrated deep introspection and cosmic understanding",
      icon: "fas fa-eye",
      rarity: "legendary",
      category: "wisdom",
      earnedDate: "2024-03-10",
      caelQuote: "True wisdom flows through you like starlight through the cosmic void."
    },
    {
      id: 5,
      name: "Transcendent Soul",
      description: "Achieved profound emotional and spiritual transformation",
      icon: "fas fa-infinity",
      rarity: "mythic",
      category: "journey",
      earnedDate: "2024-03-25",
      caelQuote: "You have transcended the boundaries of ordinary existence, becoming one with the infinite."
    },
    {
      id: 6,
      name: "Empathy Master",
      description: "Showed exceptional understanding and compassion for others",
      icon: "fas fa-hands-helping",
      rarity: "epic",
      category: "emotional",
      earnedDate: "2024-02-28",
      caelQuote: "Your empathy creates ripples of healing across the cosmic tapestry."
    }
  ];

  const userStats = {
    totalBadges: sampleBadges.length,
    rareCount: sampleBadges.filter(b => ['rare', 'epic', 'legendary', 'mythic'].includes(b.rarity)).length,
    legendaryCount: sampleBadges.filter(b => ['legendary', 'mythic'].includes(b.rarity)).length
  };

  const handleBadgeClick = (badge) => {
    console.log('Badge clicked:', badge.name);
  };

  const handlePlayAudio = (badge) => {
    setCurrentPlayingBadge(badge);
    setIsPlaying(true);
    console.log('Playing audio for:', badge.name);
    
    // Simulate audio duration
    setTimeout(() => {
      setIsPlaying(false);
      setCurrentPlayingBadge(null);
    }, 5000);
  };

  const handleStopAudio = () => {
    setIsPlaying(false);
    setCurrentPlayingBadge(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="space-y-8">
        {/* Full Gallery */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Complete Badge Gallery</h2>
          <MainComponent
            badges={sampleBadges}
            onBadgeClick={handleBadgeClick}
            isPlaying={isPlaying}
            currentPlayingBadge={currentPlayingBadge}
            onPlayAudio={handlePlayAudio}
            onStopAudio={handleStopAudio}
            userStats={userStats}
          />
        </div>

        {/* Empty State */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Empty Gallery</h2>
          <MainComponent
            badges={[]}
            onBadgeClick={handleBadgeClick}
            isPlaying={false}
            currentPlayingBadge={null}
            onPlayAudio={handlePlayAudio}
            onStopAudio={handleStopAudio}
            userStats={{ totalBadges: 0, rareCount: 0, legendaryCount: 0 }}
          />
        </div>

        {/* Limited Collection */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Starter Collection</h2>
          <MainComponent
            badges={sampleBadges.slice(0, 3)}
            onBadgeClick={handleBadgeClick}
            isPlaying={isPlaying}
            currentPlayingBadge={currentPlayingBadge}
            onPlayAudio={handlePlayAudio}
            onStopAudio={handleStopAudio}
            userStats={{ totalBadges: 3, rareCount: 2, legendaryCount: 0 }}
          />
        </div>
      </div>
    </div>
  );
});
}