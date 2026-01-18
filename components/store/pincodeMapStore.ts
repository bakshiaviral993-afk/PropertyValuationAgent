// src/components/store/pincodeMapStore.ts
// Complete India Pincode Database for Major Cities

export interface CityData {
  name: string;
  areas: AreaData[];
}

export interface AreaData {
  name: string;
  pincode: string;
}

// Complete pincode mapping
export const PINCODE_MAP: Record<string, Record<string, string>> = {
  mumbai: {
    'Andheri East': '400069',
    'Andheri West': '400053',
    'Andheri': '400053',
    'Bandra East': '400051',
    'Bandra West': '400050',
    'Bandra': '400050',
    'Borivali East': '400066',
    'Borivali West': '400092',
    'Chembur': '400071',
    'Colaba': '400005',
    'Dadar East': '400014',
    'Dadar West': '400028',
    'Goregaon East': '400063',
    'Goregaon West': '400062',
    'Juhu': '400049',
    'Kandivali East': '400101',
    'Kandivali West': '400067',
    'Kurla': '400070',
    'Lower Parel': '400013',
    'Malad East': '400097',
    'Malad West': '400064',
    'Malabar Hill': '400006',
    'Marine Drive': '400020',
    'Mulund East': '400081',
    'Mulund West': '400080',
    'Powai': '400076',
    'Santa Cruz East': '400055',
    'Santa Cruz West': '400054',
    'Thane West': '400601',
    'Thane East': '400603',
    'Vile Parle East': '400057',
    'Vile Parle West': '400056',
    'Versova': '400061',
    'Worli': '400018',
    'Churchgate': '400020',
    'Fort': '400001',
    'Parel': '400012',
    'Sion': '400022',
    'Ghatkopar': '400075',
    'Vikhroli': '400079',
    'Bhandup': '400078',
    'Khar': '400052',
  },
  
  pune: {
    'Aundh': '411007',
    'Baner': '411045',
    'Balewadi': '411045',
    'Camp': '411001',
    'Chinchwad': '411019',
    'Deccan': '411004',
    'Hadapsar': '411028',
    'Hinjewadi': '411057',
    'Kalyani Nagar': '411006',
    'Kharadi': '411014',
    'Kothrud': '411038',
    'Koregaon Park': '411001',
    'Kondhwa': '411048',
    'Magarpatta': '411028',
    'Mundhwa': '411036',
    'Nigdi': '411044',
    'Pashan': '411008',
    'Pimple Saudagar': '411027',
    'Pimpri': '411018',
    'Ravet': '412101',
    'Shivaji Nagar': '411005',
    'Sinhagad Road': '411041',
    'Undri': '411060',
    'Viman Nagar': '411014',
    'Wakad': '411057',
    'Wagholi': '412207',
    'Warje': '411058',
    'Yerwada': '411006',
  },
  
  bangalore: {
    'Whitefield': '560066',
    'Koramangala': '560034',
    'HSR Layout': '560102',
    'Electronic City': '560100',
    'Indiranagar': '560038',
    'Marathahalli': '560037',
    'JP Nagar': '560078',
    'BTM Layout': '560076',
    'Banashankari': '560070',
    'Jayanagar': '560041',
    'Malleshwaram': '560003',
    'Rajaji Nagar': '560010',
    'Yelahanka': '560064',
    'Hebbal': '560024',
    'Bellandur': '560103',
    'Sarjapur Road': '560035',
    'Bannerghatta Road': '560076',
    'MG Road': '560001',
    'Domlur': '560071',
  },
  
  delhi: {
    'Connaught Place': '110001',
    'Dwarka': '110075',
    'Rohini': '110085',
    'Saket': '110017',
    'Vasant Kunj': '110070',
    'Greater Kailash': '110048',
    'Nehru Place': '110019',
    'Lajpat Nagar': '110024',
    'Hauz Khas': '110016',
    'Janakpuri': '110058',
    'Mayur Vihar': '110091',
    'Punjabi Bagh': '110026',
    'Karol Bagh': '110005',
    'Rajouri Garden': '110027',
    'South Extension': '110049',
    'Laxmi Nagar':'110092',
  },
  
  hyderabad: {
    'Banjara Hills': '500034',
    'Jubilee Hills': '500033',
    'Gachibowli': '500032',
    'HITEC City': '500081',
    'Madhapur': '500081',
    'Kondapur': '500084',
    'Kukatpally': '500072',
    'Begumpet': '500016',
    'Secunderabad': '500003',
    'Ameerpet': '500016',
    'Dilsukhnagar': '500060',
    'LB Nagar': '500074',
    'Uppal': '500039',
  },
  
  chennai: {
    'T Nagar': '600017',
    'Anna Nagar': '600040',
    'Adyar': '600020',
    'Velachery': '600042',
    'Tambaram': '600045',
    'OMR': '600096',
    'Nungambakkam': '600034',
    'Mylapore': '600004',
    'Besant Nagar': '600090',
    'Porur': '600116',
    'Guindy': '600032',
    'Vadapalani': '600026',
  },
  
  kolkata: {
    'Salt Lake': '700064',
    'Park Street': '700016',
    'Ballygunge': '700019',
    'New Alipore': '700053',
    'Behala': '700034',
    'Jadavpur': '700032',
    'Rajarhat': '700135',
    'New Town': '700156',
    'Howrah': '711101',
  },
  
  ahmedabad: {
    'Bodakdev': '380054',
    'Satellite': '380015',
    'Vastrapur': '380015',
    'SG Highway': '380060',
    'Navrangpura': '380009',
    'Maninagar': '380008',
    'Chandkheda': '382424',
    'Thaltej': '380054',
    'Bopal': '380058',
  },
  
  jaipur: {
    'C Scheme': '302001',
    'Malviya Nagar': '302017',
    'Vaishali Nagar': '302021',
    'Mansarovar': '302020',
    'Raja Park': '302004',
    'Bani Park': '302016',
    'Ajmer Road': '302019',
    'Tonk Road': '302018',
  },
};

// City list with areas
export const CITY_LIST: CityData[] = [
  {
    name: 'Mumbai',
    areas: Object.entries(PINCODE_MAP.mumbai).map(([name, pincode]) => ({ name, pincode }))
  },
  {
    name: 'Pune',
    areas: Object.entries(PINCODE_MAP.pune).map(([name, pincode]) => ({ name, pincode }))
  },
  {
    name: 'Bangalore',
    areas: Object.entries(PINCODE_MAP.bangalore).map(([name, pincode]) => ({ name, pincode }))
  },
  {
    name: 'Delhi',
    areas: Object.entries(PINCODE_MAP.delhi).map(([name, pincode]) => ({ name, pincode }))
  },
  {
    name: 'Hyderabad',
    areas: Object.entries(PINCODE_MAP.hyderabad).map(([name, pincode]) => ({ name, pincode }))
  },
  {
    name: 'Chennai',
    areas: Object.entries(PINCODE_MAP.chennai).map(([name, pincode]) => ({ name, pincode }))
  },
  {
    name: 'Kolkata',
    areas: Object.entries(PINCODE_MAP.kolkata).map(([name, pincode]) => ({ name, pincode }))
  },
  {
    name: 'Ahmedabad',
    areas: Object.entries(PINCODE_MAP.ahmedabad).map(([name, pincode]) => ({ name, pincode }))
  },
  {
    name: 'Jaipur',
    areas: Object.entries(PINCODE_MAP.jaipur).map(([name, pincode]) => ({ name, pincode }))
  },
];

// Helper Functions
export const getPincode = (city: string, area: string): string => {
  const cityKey = city.toLowerCase();
  return PINCODE_MAP[cityKey]?.[area] || '';
};

export const getCityAreas = (city: string): string[] => {
  const cityKey = city.toLowerCase();
  return Object.keys(PINCODE_MAP[cityKey] || {});
};

export const DATABASE_STATS = {
  totalCities: Object.keys(PINCODE_MAP).length,
  totalAreas: Object.values(PINCODE_MAP).reduce((total, areas) => total + Object.keys(areas).length, 0),
  cities: Object.keys(PINCODE_MAP).map(city => city.charAt(0).toUpperCase() + city.slice(1)),
};
