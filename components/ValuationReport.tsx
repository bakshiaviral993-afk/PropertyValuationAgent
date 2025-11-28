import React from 'react';
import { ValuationResult, ValuationRequest } from '../types';
import { 
  IndianRupee, 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Info, 
  Building,
  CheckCircle2,
  Car,
  Trees
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface ValuationReportProps {
  result: ValuationResult;
  request: ValuationRequest;
}

const ValuationReport: React.FC<ValuationReportProps> = ({ result, request }) => {
  
  const formatCurrency = (val: number) => {
    if (val >= 10000000) {
        return `₹ ${(val / 10000000).toFixed(2)} Cr`;
    }
    return `₹ ${(val / 100000).toFixed(2)} L`;
  };

  const getSentimentIcon = (score: number) => {
      if (score > 0.3) return <TrendingUp className="text-green-500" />;
      if (score < -0.3) return <TrendingDown className="text-red-500" />;
      return <Minus className="text-gray-500" />;
  };

  const chartData = [
    { name: 'Min', value: result.rangeLow },
    { name: 'Valuation', value: result.estimatedValue },
    { name: 'Max', value: result.rangeHigh },
  ];

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      
      {/* Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    {String(request.projectName)} 
                    {request.bhk && <span className="text-sm font-normal text-gray-500 px-2 py-1 bg-gray-100 rounded-md">{String(request.bhk)}</span>}
                </h2>
                <div className="flex items-start text-gray-500 mt-2 space-x-2">
                    <MapPin size={16} className="mt-1 flex-shrink-0" />
                    <span>
                        {String(request.area)}, {String(request.city)}, {String(request.district)}, {String(request.state)} - {String(request.pincode)}
                    </span>
                </div>
            </div>
            <div className="mt-4 md:mt-0 flex gap-2">
                <div className="bg-brand-50 px-4 py-2 rounded-xl border border-brand-100">
                    <span className="text-brand-800 font-semibold text-sm">Age: {new Date().getFullYear() - request.constructionYear} Yrs ({String(result.propertyStatus)})</span>
                </div>
                <div className="bg-gray-100 px-4 py-2 rounded-xl border border-gray-200">
                    <span className="text-gray-800 font-semibold text-sm">Floor: {request.floor}</span>
                </div>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <p className="text-green-700 text-sm font-medium mb-1">Total Valuation</p>
                <div className="flex items-center space-x-1">
                    <IndianRupee size={24} className="text-green-700" />
                    <span className="text-3xl font-bold text-green-800">{formatCurrency(result.estimatedValue)}</span>
                </div>
                <p className="text-xs text-green-600 mt-2">Range: {formatCurrency(result.rangeLow)} - {formatCurrency(result.rangeHigh)}</p>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                 <p className="text-blue-700 text-sm font-medium mb-1">Area Details</p>
                 <div className="space-y-1 mt-1">
                    <p className="text-sm text-blue-800">Carpet: <b>{request.carpetArea}</b> sqft</p>
                    <p className="text-sm text-blue-800">Super Built-up: <b>{request.superBuiltUpArea}</b> sqft</p>
                 </div>
            </div>

            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                 <p className="text-purple-700 text-sm font-medium mb-1">Scores</p>
                 <div className="flex justify-between items-center mt-2">
                    <div className="text-center">
                        <span className="block text-xl font-bold text-purple-800">{result.confidenceScore}%</span>
                        <span className="text-xs text-purple-600">Confidence</span>
                    </div>
                    <div className="text-center border-l border-purple-200 pl-4">
                         <span className="block text-xl font-bold text-purple-800">{result.locationScore}/10</span>
                         <span className="text-xs text-purple-600">Location</span>
                    </div>
                 </div>
            </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Detailed Justification */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
             <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Info className="mr-2 text-brand-500" size={20} />
                    Valuation Justification
                </h3>
                <div className="bg-brand-50/50 p-4 rounded-xl border border-brand-100 text-sm text-gray-700 leading-relaxed">
                    {String(result.valuationJustification)}
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                 <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                        <Car size={16} />
                        <span className="text-xs font-semibold uppercase">Parking</span>
                    </div>
                    <p className="font-medium text-gray-800">{String(request.hasParking)}</p>
                    {request.hasParking === 'Yes' && <p className="text-xs text-gray-500">Charge: ₹{request.parkingCharges.toLocaleString()}</p>}
                 </div>
                 <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                        <Trees size={16} />
                        <span className="text-xs font-semibold uppercase">Amenities</span>
                    </div>
                    <p className="font-medium text-gray-800">{String(request.hasAmenities)}</p>
                    {request.hasAmenities === 'Yes' && <p className="text-xs text-gray-500">Charge: ₹{request.amenitiesCharges.toLocaleString()}</p>}
                 </div>
             </div>
             
             <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-2">Location & Infra Highlights</h4>
                <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600 border border-gray-200">{String(request.roadType)}</span>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600 border border-gray-200">Main Road: {String(request.distanceFromMainRoad)}</span>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600 border border-gray-200">FSI: {request.fsi}</span>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                    <span className="font-medium">Nearby:</span> {String(request.nearbyLocations)}
                </div>
             </div>
          </div>

          {/* Comparables & Sentiment */}
          <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                     <Building className="mr-2 text-brand-500" size={20} />
                     Market Comparables
                  </h3>
                  <div className="space-y-3">
                      {result.comparables.map((comp, idx) => (
                          <div key={idx} className="p-3 border border-gray-100 rounded-lg hover:border-brand-200 transition-colors">
                              <div className="flex justify-between items-start">
                                  <span className="font-medium text-gray-800 text-sm">{String(comp.projectName)}</span>
                                  <span className="font-bold text-brand-600 text-sm">{formatCurrency(comp.price)}</span>
                              </div>
                              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                                  <span>{String(comp.bhk)} • {comp.area} sqft</span>
                                  <span>₹{comp.pricePerSqft}/sqft</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <TrendingUp className="mr-2 text-brand-500" size={20} />
                    Market Sentiment
                </h3>
                <div className="flex items-start space-x-4">
                    <div className="mt-1">{getSentimentIcon(result.sentimentScore)}</div>
                    <div>
                        <p className="text-sm text-gray-600">{String(result.sentimentAnalysis)}</p>
                    </div>
                </div>
              </div>
          </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
         <h3 className="text-lg font-semibold text-gray-800 mb-4">Price Range Analysis</h3>
         <div style={{ width: '100%', height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 1 ? '#0ea5e9' : '#94a3b8'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};

export default ValuationReport;