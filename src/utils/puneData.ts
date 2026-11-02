export interface PuneLandmark {
  name: string;
  ward: string;
  lat: number;
  lng: number;
  pincode: string;
  category: string;
}

export const PUNE_WARDS = [
  'Shivajinagar - Ward 14',
  'Kothrud - Ward 12',
  'Viman Nagar - Ward 4',
  'Hadapsar - Ward 21',
  'Baner - Ward 9',
  'Hinjawadi IT Corridor - Ward 2',
  'Camp / Cantonment - Ward 18',
  'Swargate - Ward 16',
  'Kalyani Nagar - Ward 5',
  'Aundh - Ward 8',
  'Katraj - Ward 23',
  'Wakad - Ward 3',
];

export const PUNE_LANDMARKS: PuneLandmark[] = [
  {
    name: 'FC Road, Opp. Goodluck Cafe',
    ward: 'Shivajinagar - Ward 14',
    lat: 18.5284,
    lng: 73.8425,
    pincode: '411004',
    category: 'Commercial',
  },
  {
    name: 'Datta Mandir Chowk, Viman Nagar',
    ward: 'Viman Nagar - Ward 4',
    lat: 18.5679,
    lng: 73.9143,
    pincode: '411014',
    category: 'Residential',
  },
  {
    name: 'Karve Statue, Kothrud',
    ward: 'Kothrud - Ward 12',
    lat: 18.5074,
    lng: 73.8077,
    pincode: '411038',
    category: 'Transit',
  },
  {
    name: 'Gadital Bus Depot, Hadapsar',
    ward: 'Hadapsar - Ward 21',
    lat: 18.5022,
    lng: 73.9275,
    pincode: '411028',
    category: 'Transit',
  },
  {
    name: 'Baner-Pashan Link Road',
    ward: 'Baner - Ward 9',
    lat: 18.5482,
    lng: 73.785,
    pincode: '411045',
    category: 'Suburban',
  },
  {
    name: 'Hinjawadi Phase 1 Main Circle',
    ward: 'Hinjawadi IT Corridor - Ward 2',
    lat: 18.5913,
    lng: 73.7389,
    pincode: '411057',
    category: 'IT Park',
  },
  {
    name: 'Aurora Towers, MG Road, Camp',
    ward: 'Camp / Cantonment - Ward 18',
    lat: 18.5158,
    lng: 73.8784,
    pincode: '411001',
    category: 'Commercial',
  },
  {
    name: 'Swargate ST Bus Stand Junction',
    ward: 'Swargate - Ward 16',
    lat: 18.5018,
    lng: 73.858,
    pincode: '411042',
    category: 'Transit',
  },
  {
    name: 'Jogger’s Park, Kalyani Nagar',
    ward: 'Kalyani Nagar - Ward 5',
    lat: 18.547,
    lng: 73.903,
    pincode: '411006',
    category: 'Residential',
  },
];

export const DEMO_PRESET_IMAGES = [
  {
    title: 'Severe Asphalt Pothole',
    category: 'Potholes & Roads',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    description: 'Deep road cavity filled with water on main road',
  },
  {
    title: 'Overflowing Garbage Dump',
    category: 'Garbage & Waste',
    url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
    description: 'Decomposing garbage blocking pedestrian pathway',
  },
  {
    title: 'High-Pressure Water Leakage',
    category: 'Water Supply Leakage',
    url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
    description: 'Broken water line spurting water across street',
  },
  {
    title: 'Dark Unlit Streetlight Pole',
    category: 'Broken Streetlights',
    url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
    description: 'Extinguished street lamp fixture creating safety hazard',
  },
];
