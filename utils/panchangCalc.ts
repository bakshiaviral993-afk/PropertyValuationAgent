
import { PanchangData } from '../types';

const TITHIS = ["Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima", "Amavasya"];
const NAKSHATRAS = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"];

export const getDailyPanchang = (date: Date): PanchangData => {
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  
  // Deterministic simulation based on date
  const tithiIndex = (day + month) % TITHIS.length;
  const nakIndex = (day + month + (year % 10)) % NAKSHATRAS.length;
  
  const isGoodTithi = [1, 2, 4, 10, 12, 14].includes(tithiIndex);
  const isGoodNak = [0, 3, 11, 12, 16, 21, 26].includes(nakIndex);
  
  const score = (isGoodTithi ? 40 : 10) + (isGoodNak ? 40 : 10) + (day % 20);

  return {
    tithi: TITHIS[tithiIndex],
    nakshatra: NAKSHATRAS[nakIndex],
    yoga: "Siddha",
    rahuKaal: "10:30 AM - 12:00 PM",
    auspiciousTiming: isGoodTithi ? "09:00 AM - 11:30 AM" : "02:30 PM - 04:00 PM",
    propertyAdvice: isGoodTithi && isGoodNak 
      ? "Highly auspicious day for property purchase and registration." 
      : "Average day. Good for site visits, avoid final documentation during Rahu Kaal.",
    harmonyScore: Math.min(score, 100)
  };
};
