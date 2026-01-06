
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { PropertyStats } from '../utils/listingProcessor';
import { Binary, TrendingUp, Info, Activity, Sigma } from 'lucide-react';

interface MarketStatsProps {
  stats: PropertyStats;
  prices: number[];
  labelPrefix?: string;
}

const formatValue = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${val.toLocaleString()}`;
};

const MarketStats: React.FC<MarketStatsProps> = ({ stats, prices, labelPrefix = "Price" }) => {
  // Create histogram data
  const binCount = 6;
  const range = stats.max - stats.min;
  const binSize = range / binCount;
  
  const histogramData = Array.from({ length: binCount }).map((_, i) => {
    const start = stats.min + (i * binSize);
    const end = start + binSize;
    const count = prices.filter(p => p >= start && (i === binCount - 1 ? p <= end : p < end)).length;
    return {
      name: formatValue(start),
      count,
      range: `${formatValue(start)} - ${formatValue(end)}`
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-glass-3d">
          <div className="flex items-center gap-2 mb-2 text-neo-neon">
            <Sigma size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Mean Value</span>
          </div>
          <div className="text-2xl font-black text-white">{formatValue(stats.mean)}</div>
          <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">Global Average</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-glass-3d">
          <div className="flex items-center gap-2 mb-2 text-neo-pink">
            <Activity size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Median Pulse</span>
          </div>
          <div className="text-2xl font-black text-white">{formatValue(stats.median)}</div>
          <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">Mid-Point Signal</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-glass-3d">
          <div className="flex items-center gap-2 mb-2 text-neo-gold">
            <TrendingUp size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Std Deviation</span>
          </div>
          <div className="text-2xl font-black text-white">{formatValue(stats.stdDev)}</div>
          <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">Volatility Factor</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-glass-3d">
          <div className="flex items-center gap-2 mb-2 text-emerald-400">
            <Binary size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Sample Size</span>
          </div>
          <div className="text-2xl font-black text-white">{stats.count}</div>
          <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">Verified Nodes</div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-10 shadow-glass-3d">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className="text-xl font-black text-white tracking-tighter uppercase">Distribution Curve</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Price frequency across comparable nodes</p>
          </div>
          <div className="hidden sm:flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-neo-neon/40" />
              <span className="text-[9px] font-black text-gray-400 uppercase">Volume</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-neo-pink shadow-pink-glow" />
              <span className="text-[9px] font-black text-gray-400 uppercase">Median Marker</span>
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} 
                dy={10}
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-neo-bg border border-white/10 p-4 rounded-2xl shadow-neo-glow backdrop-blur-xl">
                        <p className="text-[10px] font-black text-neo-neon uppercase mb-1 tracking-widest">{payload[0].payload.range}</p>
                        <p className="text-xl font-black text-white">{payload[0].value} <span className="text-xs text-gray-500 font-bold">Listings</span></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[12, 12, 4, 4]}>
                {histogramData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === Math.floor(binCount / 2) ? '#585FD8' : '#1e293b'} 
                    className="transition-all duration-500 hover:opacity-80"
                  />
                ))}
              </Bar>
              <ReferenceLine x={histogramData[Math.floor(binCount / 2)].name} stroke="#FF6B9D" strokeDasharray="4 4" label={{ position: 'top', value: 'MEDIAN', fill: '#FF6B9D', fontSize: 10, fontWeight: '900' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-neo-neon/5 border border-neo-neon/20 rounded-[32px] p-6 flex items-start gap-4">
        <Info className="text-neo-neon mt-1 shrink-0" size={20} />
        <div>
          <h4 className="text-xs font-black text-neo-neon uppercase tracking-widest mb-1">Statistical Confidence Analysis</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            The market displays a <span className="text-white font-bold">{stats.stdDev > stats.mean * 0.2 ? 'High' : 'Low'} volatility</span> pattern. 
            The spread between {formatValue(stats.quartiles.q1)} (Q1) and {formatValue(stats.quartiles.q3)} (Q3) suggests a {Math.round((stats.quartiles.q3 - stats.quartiles.q1) / stats.mean * 100)}% standard deviation 
            within the immediate sector.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MarketStats;
