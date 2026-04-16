// Mock data for EduBridge application

export interface Program {
  id: string;
  title: string;
  institution: {
    id: string;
    name: string;
    logo: string;
    country: string;
    city: string;
  };
  level: 'Bachelor' | 'Master' | 'PhD' | 'Certificate';
  duration: string;
  language: string;
  mode: 'On-campus' | 'Online' | 'Hybrid';
  tuition: number;
  deadline: string;
  description: string;
  requirements: string[];
  rating: number;
  field: string;
  cover: string;
  startDate: string;
  curriculum: { module: string; description: string }[];
}

export interface Institution {
  id: string;
  name: string;
  slug: string;
  logo: string;
  cover: string;
  country: string;
  city: string;
  description: string;
  programsCount: number;
  studentsCount: number;
  acceptanceRate: string;
  rating: number;
  verified: boolean;
  website: string;
  accreditations: string[];
  location: {
    lat: number;
    lng: number;
    address: string;
    postalCode: string;
  };
}

export interface Application {
  id: string;
  programId: string;
  programTitle: string;
  institutionName: string;
  submittedDate: string;
  status: 'Draft' | 'Submitted' | 'Under review' | 'Accepted' | 'Rejected' | 'More info needed';
}

export const mockPrograms: Program[] = [
  {
    id: '1',
    title: 'Master of Science in Computer Science',
    institution: {
      id: 'mit',
      name: 'Massachusetts Institute of Technology',
      logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=100&h=100&fit=crop',
      country: 'United States',
      city: 'Cambridge',
    },
    level: 'Master',
    duration: '2 years',
    language: 'English',
    mode: 'On-campus',
    tuition: 55000,
    deadline: '2026-06-15',
    description: 'Advanced program in computer science with focus on AI, machine learning, and software engineering.',
    requirements: [
      "Bachelor's degree in Computer Science or related field",
      'GPA of 3.5 or higher',
      'GRE scores',
      'Two letters of recommendation',
      'Statement of purpose',
    ],
    rating: 4.8,
    field: 'Computer Science',
    cover: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=1200&h=400&fit=crop',
    startDate: 'September 2026',
    curriculum: [
      { module: 'Advanced Algorithms', description: 'Deep dive into complex algorithmic problems' },
      { module: 'Machine Learning', description: 'Fundamentals and applications of ML' },
      { module: 'Distributed Systems', description: 'Building scalable distributed applications' },
      { module: 'Thesis Project', description: 'Independent research project' },
    ],
  },
  {
    id: '2',
    title: 'Bachelor of Business Administration',
    institution: {
      id: 'harvard',
      name: 'Harvard Business School',
      logo: 'https://images.unsplash.com/photo-1562774053-701939374585?w=100&h=100&fit=crop',
      country: 'United States',
      city: 'Boston',
    },
    level: 'Bachelor',
    duration: '4 years',
    language: 'English',
    mode: 'On-campus',
    tuition: 52000,
    deadline: '2026-05-01',
    description: 'Comprehensive business education covering finance, marketing, strategy, and entrepreneurship.',
    requirements: [
      'High school diploma',
      'SAT or ACT scores',
      'Personal essay',
      'Letter of recommendation',
    ],
    rating: 4.9,
    field: 'Business',
    cover: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=400&fit=crop',
    startDate: 'August 2026',
    curriculum: [
      { module: 'Financial Accounting', description: 'Introduction to financial statements and analysis' },
      { module: 'Marketing Management', description: 'Strategic marketing principles' },
      { module: 'Organizational Behavior', description: 'Understanding human behavior in organizations' },
      { module: 'Business Strategy', description: 'Strategic planning and competitive analysis' },
    ],
  },
  {
    id: '3',
    title: 'Master in International Relations',
    institution: {
      id: 'oxford',
      name: 'University of Oxford',
      logo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=100&h=100&fit=crop',
      country: 'United Kingdom',
      city: 'Oxford',
    },
    level: 'Master',
    duration: '1 year',
    language: 'English',
    mode: 'On-campus',
    tuition: 32000,
    deadline: '2026-07-30',
    description: 'Study global politics, diplomacy, and international affairs in a historic university setting.',
    requirements: [
      "Bachelor's degree in related field",
      'IELTS 7.5 or TOEFL 110',
      'Academic transcript',
      'Research proposal',
    ],
    rating: 4.7,
    field: 'Political Science',
    cover: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&h=400&fit=crop',
    startDate: 'October 2026',
    curriculum: [
      { module: 'Global Governance', description: 'International organizations and policy' },
      { module: 'Conflict Resolution', description: 'Theories and practice of peacebuilding' },
      { module: 'International Law', description: 'Legal frameworks governing international relations' },
      { module: 'Dissertation', description: 'Independent research project' },
    ],
  },
  {
    id: '4',
    title: 'PhD in Biomedical Engineering',
    institution: {
      id: 'stanford',
      name: 'Stanford University',
      logo: 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=100&h=100&fit=crop',
      country: 'United States',
      city: 'Stanford',
    },
    level: 'PhD',
    duration: '5 years',
    language: 'English',
    mode: 'On-campus',
    tuition: 58000,
    deadline: '2026-12-01',
    description: 'Cutting-edge research in biomedical engineering, medical devices, and healthcare technology.',
    requirements: [
      "Master's degree in Engineering or related field",
      'GRE scores',
      'Research experience',
      'Three letters of recommendation',
      'Research statement',
    ],
    rating: 4.9,
    field: 'Engineering',
    cover: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=1200&h=400&fit=crop',
    startDate: 'September 2026',
    curriculum: [
      { module: 'Advanced Biomechanics', description: 'Mechanical principles in biological systems' },
      { module: 'Medical Imaging', description: 'Imaging technologies and analysis' },
      { module: 'Tissue Engineering', description: 'Regenerative medicine and biomaterials' },
      { module: 'Doctoral Research', description: 'Original research contribution' },
    ],
  },
  {
    id: '5',
    title: 'Master of Fine Arts in Design',
    institution: {
      id: 'risd',
      name: 'Rhode Island School of Design',
      logo: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=100&h=100&fit=crop',
      country: 'United States',
      city: 'Providence',
    },
    level: 'Master',
    duration: '2 years',
    language: 'English',
    mode: 'On-campus',
    tuition: 54000,
    deadline: '2026-01-15',
    description: 'Intensive studio-based program exploring contemporary design practice and theory.',
    requirements: [
      "Bachelor's degree in Design or related field",
      'Portfolio of 15-20 works',
      'Statement of intent',
      'Two letters of recommendation',
    ],
    rating: 4.6,
    field: 'Arts & Design',
    cover: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&h=400&fit=crop',
    startDate: 'September 2026',
    curriculum: [
      { module: 'Design Thinking', description: 'User-centered design methodologies' },
      { module: 'Visual Communication', description: 'Typography and graphic design principles' },
      { module: 'Interactive Media', description: 'Digital and interactive design' },
      { module: 'Thesis Exhibition', description: 'Culminating design project' },
    ],
  },
  {
    id: '6',
    title: 'Online MBA',
    institution: {
      id: 'insead',
      name: 'INSEAD',
      logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop',
      country: 'France',
      city: 'Fontainebleau',
    },
    level: 'Master',
    duration: '18 months',
    language: 'English',
    mode: 'Online',
    tuition: 45000,
    deadline: '2026-08-31',
    description: 'Flexible online MBA program for working professionals with global perspective.',
    requirements: [
      "Bachelor's degree",
      'GMAT or GRE scores',
      '3+ years work experience',
      'Resume and essays',
    ],
    rating: 4.7,
    field: 'Business',
    cover: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=400&fit=crop',
    startDate: 'January 2027',
    curriculum: [
      { module: 'Strategic Management', description: 'Corporate and business strategy' },
      { module: 'Global Economics', description: 'Macroeconomic principles and policy' },
      { module: 'Leadership', description: 'Leading teams and organizations' },
      { module: 'Capstone Project', description: 'Applied business project' },
    ],
  },
];

export const mockInstitutions: Institution[] = [
  {
    id: 'mit',
    name: 'Massachusetts Institute of Technology',
    slug: 'mit',
    logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=100&h=100&fit=crop',
    cover: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=1200&h=400&fit=crop',
    country: 'United States',
    city: 'Cambridge',
    description: 'MIT is a world-renowned research university dedicated to advancing knowledge in science, technology, and other areas of scholarship.',
    programsCount: 127,
    studentsCount: 11520,
    acceptanceRate: '6.7%',
    rating: 4.8,
    verified: true,
    website: 'https://mit.edu',
    accreditations: ['ABET', 'NEASC', 'AACSB'],
    location: {
      lat: 42.3601,
      lng: -71.0942,
      address: '77 Massachusetts Avenue',
      postalCode: 'MA 02139',
    },
  },
  {
    id: 'harvard',
    name: 'Harvard Business School',
    slug: 'harvard',
    logo: 'https://images.unsplash.com/photo-1562774053-701939374585?w=100&h=100&fit=crop',
    cover: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=400&fit=crop',
    country: 'United States',
    city: 'Boston',
    description: 'Harvard Business School shapes leaders who make a difference in the world through education, thought leadership, and engagement.',
    programsCount: 45,
    studentsCount: 7200,
    acceptanceRate: '4.6%',
    rating: 4.9,
    verified: true,
    website: 'https://hbs.edu',
    accreditations: ['AACSB', 'NEASC'],
    location: {
      lat: 42.3656,
      lng: -71.1224,
      address: 'Soldiers Field',
      postalCode: 'MA 02163',
    },
  },
  {
    id: 'oxford',
    name: 'University of Oxford',
    slug: 'oxford',
    logo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=100&h=100&fit=crop',
    cover: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&h=400&fit=crop',
    country: 'United Kingdom',
    city: 'Oxford',
    description: 'The University of Oxford is the oldest university in the English-speaking world and a leading research institution.',
    programsCount: 156,
    studentsCount: 24300,
    acceptanceRate: '17.5%',
    rating: 4.7,
    verified: true,
    website: 'https://ox.ac.uk',
    accreditations: ['QAA', 'EQUIS'],
    location: {
      lat: 51.7548,
      lng: -1.2544,
      address: 'Wellington Square',
      postalCode: 'OX1 2JD',
    },
  },
  {
    id: 'stanford',
    name: 'Stanford University',
    slug: 'stanford',
    logo: 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=100&h=100&fit=crop',
    cover: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=1200&h=400&fit=crop',
    country: 'United States',
    city: 'Stanford',
    description: 'Stanford University is a leading research and teaching institution, known for its entrepreneurial character.',
    programsCount: 134,
    studentsCount: 17249,
    acceptanceRate: '3.9%',
    rating: 4.9,
    verified: true,
    website: 'https://stanford.edu',
    accreditations: ['WSCUC', 'ABET', 'AACSB'],
    location: {
      lat: 37.4275,
      lng: -122.1697,
      address: '450 Serra Mall',
      postalCode: 'CA 94305',
    },
  },
];

export const mockApplications: Application[] = [
  {
    id: 'app1',
    programId: '1',
    programTitle: 'Master of Science in Computer Science',
    institutionName: 'Massachusetts Institute of Technology',
    submittedDate: '2026-03-15',
    status: 'Under review',
  },
  {
    id: 'app2',
    programId: '3',
    programTitle: 'Master in International Relations',
    institutionName: 'University of Oxford',
    submittedDate: '2026-04-02',
    status: 'Submitted',
  },
];

export const fields = [
  { name: 'Computer Science', icon: '💻', count: 1245 },
  { name: 'Business', icon: '💼', count: 987 },
  { name: 'Engineering', icon: '⚙️', count: 876 },
  { name: 'Medicine', icon: '⚕️', count: 654 },
  { name: 'Arts & Design', icon: '🎨', count: 543 },
  { name: 'Social Sciences', icon: '🌍', count: 432 },
  { name: 'Natural Sciences', icon: '🔬', count: 398 },
  { name: 'Law', icon: '⚖️', count: 321 },
];

export const countries = [
  'United States',
  'United Kingdom',
  'Canada',
  'Germany',
  'France',
  'Netherlands',
  'Australia',
  'Switzerland',
  'Sweden',
  'Italy',
];
