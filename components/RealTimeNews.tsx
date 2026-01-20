// RealTimeNews.tsx
// Place in: src/components/RealTimeNews.tsx
import React, { useEffect, useState } from 'react';
import { Newspaper, ExternalLink, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  image?: string;
}

interface RealTimeNewsProps {
  city: string;
  area: string;
  mode?: 'buy' | 'rent' | 'land' | 'commercial';
}

const RealTimeNews: React.FC<RealTimeNewsProps> = ({ city, area, mode = 'buy' }) => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNews();
  }, [city, area]);

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build search query based on mode
      const modeKeywords = {
        buy: 'property sale purchase investment',
        rent: 'rental lease housing',
        land: 'land plot development',
        commercial: 'commercial office retail'
      };
      
      const query = `${city} ${area} real estate ${modeKeywords[mode]}`;
      
      // Use Google News RSS via RSS2JSON (free, no API key needed)
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=15`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      
      const data = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error(data.message || 'News API error');
      }
      
      const articles: NewsArticle[] = data.items.map((item: any) => ({
        title: cleanTitle(item.title),
        description: stripHtml(item.description || item.content || '').substring(0, 200) + '...',
        url: item.link,
        source: extractSource(item.title) || item.author || 'Google News',
        publishedAt: formatDate(item.pubDate),
        image: item.thumbnail || item.enclosure?.link
      }));
      
      setNews(articles);
    } catch (err) {
      console.error('News fetch error:', err);
      setError('Unable to load news. Please try again later.');
      
      // Fallback to static curated news
      setNews(getFallbackNews(city, area));
    } finally {
      setLoading(false);
    }
  };

  // Clean title by removing source prefix
  const cleanTitle = (title: string): string => {
    // Remove "Source - " prefix pattern
    return title.replace(/^[^-]+-\s*/, '').trim();
  };

  // Extract source from title
  const extractSource = (title: string): string | null => {
    const match = title.match(/^([^-]+)-/);
    return match ? match[1].trim() : null;
  };

  // Strip HTML tags
  const stripHtml = (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Format date
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Fallback news when API fails
  const getFallbackNews = (city: string, area: string): NewsArticle[] => {
    return [
      {
        title: `Real Estate Market Update: ${city}`,
        description: `Latest trends and developments in ${area} property market. Prices show steady growth with increasing demand.`,
        url: '#',
        source: 'Market Intelligence',
        publishedAt: 'Today'
      },
      {
        title: `Property Investment Opportunities in ${area}`,
        description: `Experts highlight ${area} as a promising location for property investment with good infrastructure development.`,
        url: '#',
        source: 'Property Times',
        publishedAt: '1d ago'
      },
      {
        title: `${city} Infrastructure Development Boosts Real Estate`,
        description: `New metro connectivity and road projects are expected to increase property values in ${city} suburbs.`,
        url: '#',
        source: 'Urban Development',
        publishedAt: '2d ago'
      }
    ];
  };

  if (loading) {
    return (
      <div className="bg-white/5 rounded-[32px] p-8 border border-white/10">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-blue-400 mr-3" size={32} />
          <span className="text-gray-400 font-bold">Loading latest real estate news...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-[32px] p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-white uppercase flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Newspaper size={20} className="text-blue-400" />
          </div>
          Latest Real Estate News
        </h3>
        <button 
          onClick={loadNews}
          disabled={loading}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
          title="Refresh news"
        >
          <RefreshCw 
            size={18} 
            className={`text-blue-400 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`} 
          />
        </button>
      </div>

      {error && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-bold text-sm">{error}</p>
            <p className="text-gray-400 text-xs mt-1">Showing curated news instead.</p>
          </div>
        </div>
      )}

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {news.length > 0 ? (
          news.map((article, idx) => (
            <a
              key={idx}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-blue-400/30 transition-all group"
            >
              <div className="flex gap-4">
                {article.image && (
                  <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                    <img 
                      src={article.image} 
                      alt={article.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2 mb-2 text-base">
                    {article.title}
                  </h4>
                  <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                    {article.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="font-semibold text-blue-400">{article.source}</span>
                    <span>•</span>
                    <span>{article.publishedAt}</span>
                    <ExternalLink size={12} className="ml-auto text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </a>
          ))
        ) : (
          <div className="text-center py-12">
            <Newspaper className="mx-auto text-gray-600 mb-3 opacity-30" size={48} />
            <p className="text-gray-400">No recent news available</p>
            <p className="text-gray-500 text-sm mt-1">Try refreshing or check back later</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-gray-500 text-center">
          News powered by Google News • Updated in real-time • {news.length} articles loaded
        </p>
      </div>
    </div>
  );
};

export default RealTimeNews;
