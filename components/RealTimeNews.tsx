// RealTimeNews.tsx - Fixed with error handling
import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, TrendingUp, AlertCircle } from 'lucide-react';

interface RealTimeNewsProps {
  city: string;
  area: string;
  mode: 'buy' | 'rent';
}

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

const RealTimeNews: React.FC<RealTimeNewsProps> = ({ city, area, mode }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, [city, area, mode]);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const query = `${city} real estate ${mode === 'rent' ? 'rental' : 'property'} market news`;
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
      
      // Try RSS2JSON API first
      const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&api_key=YOUR_API_KEY&count=5`;
      
      const response = await fetch(rss2jsonUrl);
      
      if (!response.ok) {
        throw new Error('RSS feed unavailable');
      }
      
      const data = await response.json();
      
      if (data.status === 'ok' && data.items) {
        setNews(data.items.slice(0, 3));
      } else {
        throw new Error('Invalid RSS response');
      }
    } catch (err) {
      console.error('News fetch error:', err);
      setError('Unable to load news');
      // Set fallback news
      setNews(getFallbackNews(city, mode));
    } finally {
      setLoading(false);
    }
  };

  const getFallbackNews = (city: string, mode: string): NewsItem[] => {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    return [
      {
        title: `${city} Real Estate Market Shows Steady Growth in 2025`,
        link: `https://www.google.com/search?q=${encodeURIComponent(city + ' real estate news')}`,
        pubDate: currentDate,
        description: `The ${city} real estate market continues to show resilient growth with increasing demand in residential and commercial sectors.`
      },
      {
        title: `${mode === 'rent' ? 'Rental' : 'Property'} Prices in ${city} Remain Stable`,
        link: `https://www.google.com/search?q=${encodeURIComponent(city + ' property prices')}`,
        pubDate: currentDate,
        description: `Market analysis indicates stable ${mode === 'rent' ? 'rental yields' : 'property values'} across key localities.`
      },
      {
        title: `Infrastructure Development Boosts ${city} Property Market`,
        link: `https://www.google.com/search?q=${encodeURIComponent(city + ' infrastructure development')}`,
        pubDate: currentDate,
        description: `New infrastructure projects are positively impacting property values and investment potential in ${city}.`
      }
    ];
  };

  if (loading && news.length === 0) {
    return (
      <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 shadow-glass-3d">
        <div className="flex items-center gap-3 mb-6">
          <Newspaper size={20} className="text-blue-400" />
          <h3 className="text-lg font-black text-white uppercase tracking-tight">Market News</h3>
        </div>
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-white/5 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 shadow-glass-3d">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Newspaper size={20} className="text-blue-400" />
          <h3 className="text-lg font-black text-white uppercase tracking-tight">Market News</h3>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-xs text-yellow-400">
            <AlertCircle size={14} />
            <span>Live feed unavailable</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {news.map((item, idx) => (
          <a
            key={idx}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white/5 rounded-xl p-4 border border-white/10 hover:border-blue-400/40 transition-all group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                  {item.description?.replace(/<[^>]*>/g, '')}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <TrendingUp size={10} />
                  <span>{item.pubDate}</span>
                </div>
              </div>
              <ExternalLink size={14} className="text-gray-500 group-hover:text-blue-400 transition-colors flex-shrink-0 mt-1" />
            </div>
          </a>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5">
        <a
          href={`https://www.google.com/search?q=${encodeURIComponent(city + ' real estate news')}&tbm=nws`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2 justify-center"
        >
          View More News <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
};

export default RealTimeNews;
