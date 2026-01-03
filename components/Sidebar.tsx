
import React from 'react';
import { GlobalContext } from '../types';
import { MapPin, Camera, Upload, Info } from 'lucide-react';

interface SidebarProps {
  context: GlobalContext;
  onContextChange: (ctx: GlobalContext) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ context, onContextChange }) => {
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Fixed: f is unknown when mapping over FileList, cast to File is required for URL.createObjectURL
      const newPhotos = Array.from(e.target.files).map(f => URL.createObjectURL(f as File));
      onContextChange({ ...context, photos: [...context.photos, ...newPhotos] });
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-[320px] border-r border-cyber-border bg-cyber-black/50 backdrop-blur-xl p-6 gap-8 overflow-y-auto">
      <div>
        <h3 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
          <MapPin size={12} className="text-cyber-teal" /> SECTOR_LOCATOR
        </h3>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-mono text-gray-600 uppercase">Address / Street</label>
            <input 
              type="text" 
              placeholder="e.g. MG Road, Camp"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyber-teal transition-all font-mono"
              value={context.address}
              onChange={(e) => onContextChange({ ...context, address: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-mono text-gray-600 uppercase">Pincode</label>
            <input 
              type="text" 
              placeholder="411001"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyber-teal transition-all font-mono"
              value={context.pincode}
              onChange={(e) => onContextChange({ ...context, pincode: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
          <Camera size={12} className="text-cyber-teal" /> VISUAL_RECON
        </h3>
        <div className="space-y-4">
          <div className="relative group">
            <input 
              type="file" 
              multiple 
              onChange={handlePhotoUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-full aspect-video border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 group-hover:border-cyber-teal/50 transition-all bg-black/20">
              <Upload size={24} className="text-gray-500 group-hover:text-cyber-teal" />
              <span className="text-[9px] font-mono text-gray-600 uppercase">Drop Recon Images</span>
            </div>
          </div>
          
          {context.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {context.photos.map((p, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden border border-white/10">
                  <img src={p} className="w-full h-full object-cover" alt="Property Recon" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto p-4 bg-cyber-teal/5 border border-cyber-teal/20 rounded-2xl">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-cyber-teal shrink-0 mt-0.5" />
          <p className="text-[10px] text-gray-400 font-mono leading-relaxed">
            SYSTEM_ADVISORY: Accurate Location context improves Valuation Confidence by up to 14.2%.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
