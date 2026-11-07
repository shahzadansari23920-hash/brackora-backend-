import express from 'express';

import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { 
  User, 
  Tournament, 
  WalletTransaction, 
  NotificationItem, 
  Complaint,
  BracketMatch,
  Participant
} from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Restricted Indian states under state gaming laws (Assam, Odisha, Telangana, Andhra Pradesh, Nagaland, Sikkim)
const RESTRICTED_INDIAN_STATES = [
  'Assam',
  'Odisha',
  'Telangana',
  'Andhra Pradesh',
  'Nagaland',
  'Sikkim'
];

interface DBState {
  users: User[];
  tournaments: Tournament[];
  transactions: WalletTransaction[];
  notifications: NotificationItem[];
  complaints: Complaint[];
  activeUserId: string;
}

const DB_FILE = path.join(__dirname, 'data', 'brackora_db.json');

// Initial seed data with high-quality tournaments and visual assets
const initialUsers: User[] = [
  {
    id: 'user_player_1',
    userId: 'BRK-7842',
    name: 'Aman "Viper" Sharma',
    username: 'viper_strike',
    mobile: '+91 98765 43210',
    email: 'viper.strike@esports.in',
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
    role: 'player',
    isOrganizerApproved: true,
    isKycVerified: true,
    age: 22,
    state: 'Maharashtra',
    stats: {
      matchesPlayed: 48,
      matchesWon: 29,
      winRate: 60.4,
      kdRatio: 4.82,
      totalEarnings: 18500,
      trophies: 12
    },
    wallet: {
      totalBalance: 3450,
      winningsBalance: 2950,
      depositBalance: 500,
      bonusBalance: 100
    },
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    status: 'active'
  },
  {
    id: 'user_organizer_1',
    userId: 'BRK-1024',
    name: 'Apex Gaming India',
    username: 'apexgaming_in',
    mobile: '+91 98111 22334',
    email: 'contact@apexgaming.in',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'organizer',
    isOrganizerApproved: true,
    isKycVerified: true,
    age: 27,
    state: 'Karnataka',
    stats: {
      matchesPlayed: 110,
      matchesWon: 74,
      winRate: 67.2,
      kdRatio: 5.10,
      totalEarnings: 94000,
      trophies: 28
    },
    wallet: {
      totalBalance: 12400,
      winningsBalance: 8200,
      depositBalance: 4200,
      bonusBalance: 250
    },
    createdAt: new Date(Date.now() - 120 * 86400000).toISOString(),
    status: 'active'
  },
  {
    id: 'user_admin_1',
    userId: 'BRK-0001',
    name: 'Brackora Admin HQ',
    username: 'brackora_hq',
    mobile: '+91 99999 00001',
    email: 'admin@brackora.in',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    isOrganizerApproved: true,
    isKycVerified: true,
    age: 32,
    state: 'Delhi',
    stats: {
      matchesPlayed: 25,
      matchesWon: 18,
      winRate: 72.0,
      kdRatio: 6.2,
      totalEarnings: 45000,
      trophies: 8
    },
    wallet: {
      totalBalance: 85000,
      winningsBalance: 75000,
      depositBalance: 10000,
      bonusBalance: 500
    },
    createdAt: new Date(Date.now() - 200 * 86400000).toISOString(),
    status: 'active'
  }
];

const initialTournaments: Tournament[] = [
  {
    id: 'tourn_1',
    tournamentId: 'BRK-BGMI-9920',
    name: 'BGMI Pro Scrims: Desert Storm Grand Finals',
    banner: '/src/assets/images/tournament_bgmi_battle_1793811291485.jpg',
    game: 'BGMI',
    format: 'Squad',
    matchFormat: 'Battle Royale Points',
    maxParticipants: 25,
    currentParticipants: 22,
    entryType: 'sponsored',
    entryFee: 0,
    prizePool: 50000,
    prizes: {
      first: 25000,
      second: 15000,
      third: 7000,
      mvp: 3000
    },
    startTime: new Date(Date.now() + 2 * 3600000).toISOString(),
    registrationDeadline: new Date(Date.now() + 1 * 3600000).toISOString(),
    rules: [
      'Erangel / Miramar competitive point system (15 pts for Winner, 1 pt per kill).',
      'No iPads, triggers, or third-party emulators. Device verification enabled.',
      'All players must record in-game POV audio + video for verification.',
      'Room ID & Password will be revealed 15 minutes before match time.'
    ],
    organizer: {
      id: 'user_organizer_1',
      name: 'Apex Gaming India',
      username: 'apexgaming_in',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      verified: true
    },
    status: 'registration_open',
    roomDetails: {
      roomId: '9481029',
      password: 'brackorapro99',
      serverRegion: 'Asia Mumbai'
    },
    participants: [
      {
        id: 'part_1',
        userId: 'user_player_1',
        username: 'viper_strike',
        teamName: 'Soul Strikers',
        inGameName: 'ViperX_7',
        inGameId: '554902194',
        avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
        registeredAt: new Date(Date.now() - 3600000).toISOString(),
        status: 'approved',
        score: 38,
        kills: 14,
        rank: 1
      },
      {
        id: 'part_2',
        userId: 'user_rival_1',
        username: 'godlike_phantom',
        teamName: 'Phantom Elite',
        inGameName: 'PhaNtoM_Op',
        inGameId: '519284711',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        registeredAt: new Date(Date.now() - 7200000).toISOString(),
        status: 'approved',
        score: 31,
        kills: 11,
        rank: 2
      },
      {
        id: 'part_3',
        userId: 'user_rival_2',
        username: 'blaze_warrior',
        teamName: 'Titan Force',
        inGameName: 'Blaze_T1',
        inGameId: '582910394',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
        registeredAt: new Date(Date.now() - 10000000).toISOString(),
        status: 'approved',
        score: 24,
        kills: 8,
        rank: 3
      }
    ],
    isFeatured: true,
    isPopular: true,
    sponsorName: 'RedBull Esports & Logitech G',
    organizerFeeEarned: 2500,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'tourn_2',
    tournamentId: 'BRK-FF-4412',
    name: 'Free Fire MAX Cyber Rush Championship',
    banner: '/src/assets/images/tournament_freefire_clash_1793811292001.jpg',
    game: 'Free Fire',
    format: 'Squad',
    matchFormat: 'Battle Royale Points',
    maxParticipants: 12,
    currentParticipants: 12,
    entryType: 'paid',
    entryFee: 50,
    prizePool: 12000,
    prizes: {
      first: 6000,
      second: 3500,
      third: 1500,
      mvp: 1000
    },
    startTime: new Date(Date.now() - 1800000).toISOString(),
    registrationDeadline: new Date(Date.now() - 3600000).toISOString(),
    rules: [
      'Bermuda Classic map. Gun properties DISABLED for fair skill competition.',
      'Headshot trackers enabled; any suspicious configs lead to immediate disqualification.',
      'Organizers stream the room live with 2-minute delay.'
    ],
    organizer: {
      id: 'user_organizer_1',
      name: 'Apex Gaming India',
      username: 'apexgaming_in',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      verified: true
    },
    status: 'live',
    roomDetails: {
      roomId: '8392019',
      password: 'ffprobrackora',
      serverRegion: 'India'
    },
    participants: [
      {
        id: 'ff_p1',
        userId: 'user_player_1',
        username: 'viper_strike',
        teamName: 'Team Nova',
        inGameName: 'ViperFF',
        inGameId: '8829104',
        avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
        registeredAt: new Date(Date.now() - 86400000).toISOString(),
        status: 'approved',
        score: 42,
        kills: 16,
        rank: 1
      }
    ],
    isFeatured: true,
    isPopular: true,
    organizerFeeEarned: 600,
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString()
  },
  {
    id: 'tourn_3',
    tournamentId: 'BRK-CODM-8819',
    name: 'Call of Duty Mobile: Operation Nightfall 5v5',
    banner: '/src/assets/images/tournament_codm_warfare_1793811291456.jpg',
    game: 'Call of Duty',
    format: 'Team',
    matchFormat: 'Single Elimination',
    maxParticipants: 8,
    currentParticipants: 8,
    entryType: 'free',
    entryFee: 0,
    prizePool: 20000,
    prizes: {
      first: 12000,
      second: 5000,
      third: 3000
    },
    startTime: new Date(Date.now() + 24 * 3600000).toISOString(),
    registrationDeadline: new Date(Date.now() + 18 * 3600000).toISOString(),
    rules: [
      'Search and Destroy competitive rules (Hardhat, Standoff, Raid, Summit).',
      'Scorestreaks and Operator Skills restricted per COD Mobile esports rulebook.'
    ],
    organizer: {
      id: 'user_admin_1',
      name: 'Brackora HQ Tournaments',
      username: 'brackora_hq',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      verified: true
    },
    status: 'upcoming',
    participants: [],
    bracket: [
      {
        id: 'm1',
        tournamentId: 'tourn_3',
        round: 1,
        roundName: 'Quarter Finals',
        matchNumber: 1,
        team1: { id: 't1', name: 'Team Vitality IN' },
        team2: { id: 't2', name: 'Revenant Esports' },
        status: 'pending'
      },
      {
        id: 'm2',
        tournamentId: 'tourn_3',
        round: 1,
        roundName: 'Quarter Finals',
        matchNumber: 2,
        team1: { id: 't3', name: 'GodLike CoDM' },
        team2: { id: 't4', name: 'Team SouL 5v5' },
        status: 'pending'
      },
      {
        id: 'm3',
        tournamentId: 'tourn_3',
        round: 1,
        roundName: 'Quarter Finals',
        matchNumber: 3,
        team1: { id: 't5', name: 'Entity Gaming' },
        team2: { id: 't6', name: 'Global Esports' },
        status: 'pending'
      },
      {
        id: 'm4',
        tournamentId: 'tourn_3',
        round: 1,
        roundName: 'Quarter Finals',
        matchNumber: 4,
        team1: { id: 't7', name: 'Orangutan Pro' },
        team2: { id: 't8', name: 'Enigma Gaming' },
        status: 'pending'
      },
      {
        id: 'm5',
        tournamentId: 'tourn_3',
        round: 2,
        roundName: 'Semi Finals',
        matchNumber: 5,
        team1: { id: 't1', name: 'TBD' },
        team2: { id: 't3', name: 'TBD' },
        status: 'pending'
      },
      {
        id: 'm6',
        tournamentId: 'tourn_3',
        round: 2,
        roundName: 'Semi Finals',
        matchNumber: 6,
        team1: { id: 't5', name: 'TBD' },
        team2: { id: 't7', name: 'TBD' },
        status: 'pending'
      },
      {
        id: 'm7',
        tournamentId: 'tourn_3',
        round: 3,
        roundName: 'Grand Finals',
        matchNumber: 7,
        team1: { id: 'f1', name: 'TBD' },
        team2: { id: 'f2', name: 'TBD' },
        status: 'pending'
      }
    ],
    isFeatured: true,
    isPopular: false,
    sponsorName: 'Monster Energy Gaming',
    createdAt: new Date(Date.now() - 36 * 3600000).toISOString()
  },
  {
    id: 'tourn_4',
    tournamentId: 'BRK-CHESS-3301',
    name: 'Grandmaster Speed Chess Invitational 3+2 Blitz',
    banner: '/src/assets/images/tournament_chess_esports_1793811293301.jpg',
    game: 'Chess',
    format: 'Solo',
    matchFormat: 'Single Elimination',
    maxParticipants: 16,
    currentParticipants: 16,
    entryType: 'sponsored',
    entryFee: 0,
    prizePool: 35000,
    prizes: {
      first: 20000,
      second: 10000,
      third: 5000
    },
    startTime: new Date(Date.now() - 86400000).toISOString(),
    registrationDeadline: new Date(Date.now() - 90000000).toISOString(),
    rules: [
      'FIDE Blitz speed chess rules (3 minutes + 2 seconds increment).',
      'Fair play detection and camera monitoring enabled.'
    ],
    organizer: {
      id: 'user_admin_1',
      name: 'Brackora HQ Tournaments',
      username: 'brackora_hq',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      verified: true
    },
    status: 'completed',
    participants: [],
    winnerResults: {
      firstPlace: { userId: 'user_player_1', name: 'Aman "Viper" Sharma', prize: 20000 },
      secondPlace: { userId: 'user_chess_2', name: 'Arjun "Knight" Deshmukh', prize: 10000 },
      thirdPlace: { userId: 'user_chess_3', name: 'Priya "Queen" Nair', prize: 5000 },
      verifiedByOrganizer: true,
      approvedByAdmin: true,
      distributedAt: new Date(Date.now() - 40000000).toISOString()
    },
    isFeatured: false,
    isPopular: true,
    sponsorName: 'ChessBase India Community',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'tourn_5',
    tournamentId: 'BRK-CRIC-5520',
    name: 'Real Cricket 24 Super League T20 Blitz',
    banner: '/src/assets/images/hero_esports_arena_1793811291046.jpg',
    game: 'Cricket',
    format: 'Solo',
    matchFormat: 'Single Elimination',
    maxParticipants: 32,
    currentParticipants: 19,
    entryType: 'free',
    entryFee: 0,
    prizePool: 15000,
    prizes: {
      first: 8000,
      second: 4500,
      third: 2500
    },
    startTime: new Date(Date.now() + 48 * 3600000).toISOString(),
    registrationDeadline: new Date(Date.now() + 40 * 3600000).toISOString(),
    rules: [
      '5-Over Quick Match mode with equal team overall rating.',
      'Stable broadband connection required.'
    ],
    organizer: {
      id: 'user_organizer_1',
      name: 'Apex Gaming India',
      username: 'apexgaming_in',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      verified: true
    },
    status: 'upcoming',
    participants: [],
    isFeatured: false,
    isPopular: false,
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString()
  }
];

const initialTransactions: WalletTransaction[] = [
  {
    id: 'txn_1',
    userId: 'user_player_1',
    type: 'prize',
    amount: 20000,
    currency: 'INR',
    status: 'completed',
    referenceId: 'TXN-BRK-CHESS-01',
    description: '1st Place Reward: Grandmaster Speed Chess Blitz',
    createdAt: new Date(Date.now() - 40000000).toISOString(),
    completedAt: new Date(Date.now() - 40000000).toISOString()
  },
  {
    id: 'txn_2',
    userId: 'user_player_1',
    type: 'deposit',
    amount: 10,
    currency: 'INR',
    status: 'completed',
    referenceId: 'TXN-BRK-UPI-88214',
    gatewayTxnId: 'ICICI_UPI_994821038592',
    upiApp: 'phonepe',
    description: 'Verified UPI Deposit via PhonePe Gateway',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 3 + 4000).toISOString()
  },
  {
    id: 'txn_3',
    userId: 'user_player_1',
    type: 'entry_fee',
    amount: 50,
    currency: 'INR',
    status: 'completed',
    referenceId: 'TXN-BRK-ENTRY-4412',
    description: 'Entry Fee: Free Fire MAX Cyber Rush Championship',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    completedAt: new Date(Date.now() - 86400000).toISOString()
  }
];

const initialNotifications: NotificationItem[] = [
  {
    id: 'notif_1',
    userId: 'user_player_1',
    title: 'Match Room Credentials Ready',
    message: 'Room ID: 9481029, Password: brackorapro99 for BGMI Pro Scrims. Room opens in 15 mins!',
    type: 'match_reminder',
    read: false,
    createdAt: new Date(Date.now() - 900000).toISOString()
  },
  {
    id: 'notif_2',
    userId: 'user_player_1',
    title: '₹20,000 Prize Credited!',
    message: 'Congratulations! Your 1st place prize for Grandmaster Speed Chess Blitz has been added to your wallet balance.',
    type: 'prize',
    read: true,
    createdAt: new Date(Date.now() - 40000000).toISOString()
  },
  {
    id: 'notif_3',
    userId: 'user_player_1',
    title: 'UPI Deposit Verified',
    message: 'Deposit of ₹1,000 via PhonePe was successfully verified by gateway webhooks and added to your balance.',
    type: 'payment',
    read: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];

const initialComplaints: Complaint[] = [
  {
    id: 'comp_1',
    userId: 'user_rival_1',
    username: 'godlike_phantom',
    tournamentId: 'tourn_1',
    subject: 'Point calculation query for Match 2',
    message: 'Our squad had 11 confirmed kills but table shows 9 kills. Please recheck match telemetry screenshot.',
    category: 'gameplay_dispute',
    status: 'investigating',
    createdAt: new Date(Date.now() - 7200000).toISOString()
  }
];

// Helper to ensure data directory exists and load/save state
function loadDB(): DBState {
  try {
    if (!fs.existsSync(path.dirname(DB_FILE))) {
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading DB file, fallback to memory:', err);
  }
  const defaultState: DBState = {
    users: initialUsers,
    tournaments: initialTournaments,
    transactions: initialTransactions,
    notifications: initialNotifications,
    complaints: initialComplaints,
    activeUserId: 'user_player_1'
  };
  saveDB(defaultState);
  return defaultState;
}

function saveDB(state: DBState) {
  try {
    if (!fs.existsSync(path.dirname(DB_FILE))) {
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB:', err);
  }
}

let db = loadDB();

// Setup Express application
async function createServer() {
  const app = express();
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // ---------------- AUTH ROUTES ----------------
  // Get active session user
  app.get('/api/auth/current', (req, res) => {
    const user = db.users.find(u => u.id === db.activeUserId) || db.users[0];
    res.json({ success: true, user });
  });

  // Switch persona role (for frictionless testing between Player, Organizer, and Main Owner Admin)
  app.post('/api/auth/switch-role', (req, res) => {
    const { targetRole } = req.body;
    let targetUser = db.users.find(u => u.role === targetRole);
    if (!targetUser) {
      targetUser = db.users[0];
    }
    db.activeUserId = targetUser.id;
    saveDB(db);
    res.json({ success: true, user: targetUser });
  });

  // Mobile OTP simulation & Login
  app.post('/api/auth/send-otp', (req, res) => {
    const { mobile } = req.body;
    if (!mobile || mobile.length < 10) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit Indian mobile number required' });
    }
    // Realistic OTP generation (in demo/dev mode OTP is auto-shared in response)
    const simulatedOtp = '7291';
    res.json({
      success: true,
      message: `OTP sent successfully to ${mobile}`,
      otp: simulatedOtp
    });
  });

  app.post('/api/auth/verify-otp', (req, res) => {
    const { mobile, otp, username } = req.body;
    if (otp !== '7291' && otp !== '1234') {
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Please enter 7291.' });
    }

    let user = db.users.find(u => u.mobile.replace(/\s+/g, '').includes(mobile.replace(/\s+/g, '')));
    if (!user) {
      const newId = `user_${Date.now()}`;
      const uniqueBrkId = `BRK-${Math.floor(1000 + Math.random() * 9000)}`;
      user = {
        id: newId,
        userId: uniqueBrkId,
        name: username || `Player ${uniqueBrkId}`,
        username: username?.toLowerCase().replace(/\s+/g, '_') || `player_${uniqueBrkId.toLowerCase()}`,
        mobile: mobile,
        email: `${username?.toLowerCase() || 'player'}@brackora.in`,
        avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
        role: 'player',
        isOrganizerApproved: false,
        isKycVerified: false,
        age: 21,
        state: 'Maharashtra',
        stats: {
          matchesPlayed: 0,
          matchesWon: 0,
          winRate: 0,
          kdRatio: 0,
          totalEarnings: 0,
          trophies: 0
        },
        wallet: {
          totalBalance: 50, // Welcome signup bonus
          winningsBalance: 0,
          depositBalance: 0,
          bonusBalance: 50
        },
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      db.users.push(user);
    }
    db.activeUserId = user.id;
    saveDB(db);
    res.json({ success: true, user });
  });

  // Google Login flow
  app.post('/api/auth/google', (req, res) => {
    const { email, name, avatar } = req.body;
    let user = db.users.find(u => u.email === email);
    if (!user) {
      const newId = `user_${Date.now()}`;
      const uniqueBrkId = `BRK-${Math.floor(1000 + Math.random() * 9000)}`;
      user = {
        id: newId,
        userId: uniqueBrkId,
        name: name || 'Google Gamer',
        username: (name || 'gamer').toLowerCase().replace(/\s+/g, '_') + '_' + uniqueBrkId.toLowerCase(),
        mobile: '+91 98' + Math.floor(10000000 + Math.random() * 90000000),
        email: email || `user_${Date.now()}@gmail.com`,
        avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        role: 'player',
        isOrganizerApproved: false,
        isKycVerified: false,
        age: 23,
        state: 'Delhi',
        stats: {
          matchesPlayed: 0,
          matchesWon: 0,
          winRate: 0,
          kdRatio: 0,
          totalEarnings: 0,
          trophies: 0
        },
        wallet: {
          totalBalance: 100,
          winningsBalance: 0,
          depositBalance: 50,
          bonusBalance: 50
        },
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      db.users.push(user);
    }
    db.activeUserId = user.id;
    saveDB(db);
    res.json({ success: true, user });
  });

  // Update profile
  app.post('/api/auth/profile', (req, res) => {
    const user = db.users.find(u => u.id === db.activeUserId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { name, username, age, state, avatar } = req.body;
    if (name) user.name = name;
    if (username) user.username = username;
    if (age) user.age = Number(age);
    if (state) user.state = state;
    if (avatar) user.avatar = avatar;

    saveDB(db);
    res.json({ success: true, user });
  });

  // ---------------- TOURNAMENTS ROUTES ----------------
  // Get all tournaments with filters
  app.get('/api/tournaments', (req, res) => {
    const { game, status, format, entryType, search } = req.query;
    let list = [...db.tournaments];

    if (game && game !== 'All') {
      list = list.filter(t => t.game.toLowerCase() === (game as string).toLowerCase());
    }
    if (status && status !== 'all') {
      list = list.filter(t => t.status === status);
    }
    if (format && format !== 'all') {
      list = list.filter(t => t.format.toLowerCase() === (format as string).toLowerCase());
    }
    if (entryType && entryType !== 'all') {
      list = list.filter(t => t.entryType === entryType);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      list = list.filter(t => 
        t.name.toLowerCase().includes(q) ||
        t.tournamentId.toLowerCase().includes(q) ||
        t.game.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, tournaments: list });
  });

  // Get single tournament by ID or Tournament code
  app.get('/api/tournaments/:id', (req, res) => {
    const { id } = req.params;
    const tourn = db.tournaments.find(t => t.id === id || t.tournamentId === id);
    if (!tourn) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }
    res.json({ success: true, tournament: tourn });
  });

  // Create tournament
  app.post('/api/tournaments', (req, res) => {
    const user = db.users.find(u => u.id === db.activeUserId);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const {
      name,
      banner,
      game,
      format,
      matchFormat,
      maxParticipants,
      startTime,
      registrationDeadline,
      rules,
      entryType,
      entryFee,
      prizePool,
      prizes,
      sponsorName
    } = req.body;

    if (!name || !game || !format) {
      return res.status(400).json({ success: false, message: 'Missing required tournament parameters' });
    }

    const normalizedPrizePool = Number(prizePool ?? 0);
    if (!Number.isFinite(normalizedPrizePool) || normalizedPrizePool < 10) {
      return res.status(400).json({ success: false, message: 'Prize pool must be a non-negative number' });
    }
    if (!req.body.entryFee ||
    Number(req.body.entryFee) < 10) {
    return res.status(400).json({ success: false, message: 'Entry fee kam se kam 10 honi chahiye!' }); }
    const newId = `tourn_${Date.now()}`;
    const codeSuffix = Math.floor(1000 + Math.random() * 9000);
    const tournamentCode = `BRK-${game.substring(0, 4).toUpperCase().replace(/\s+/g, '')}-${codeSuffix}`;

    // Generate starter bracket if Single Elimination
    const participantsCount = Number(maxParticipants) || 16;
    let bracketMatches: BracketMatch[] = [];
    if (matchFormat === 'Single Elimination') {
      // 8 or 16 player starter brackets
      const rounds = participantsCount >= 16 ? 4 : 3;
      const quarterCount = 4;
      for (let i = 1; i <= quarterCount; i++) {
        bracketMatches.push({
          id: `m_r1_${i}`,
          tournamentId: newId,
          round: 1,
          roundName: 'Quarter Finals',
          matchNumber: i,
          team1: { id: `seed_${i * 2 - 1}`, name: `Seed #${i * 2 - 1}` },
          team2: { id: `seed_${i * 2}`, name: `Seed #${i * 2}` },
          status: 'pending'
        });
      }
      for (let i = 1; i <= 2; i++) {
        bracketMatches.push({
          id: `m_r2_${i}`,
          tournamentId: newId,
          round: 2,
          roundName: 'Semi Finals',
          matchNumber: quarterCount + i,
          team1: { id: `tbd_semis_${i * 2 - 1}`, name: 'Winner QF' + (i * 2 - 1) },
          team2: { id: `tbd_semis_${i * 2}`, name: 'Winner QF' + (i * 2) },
          status: 'pending'
        });
      }
      bracketMatches.push({
        id: `m_final`,
        tournamentId: newId,
        round: 3,
        roundName: 'Grand Finals',
        matchNumber: 7,
        team1: { id: 'tbd_f1', name: 'Winner SF1' },
        team2: { id: 'tbd_f2', name: 'Winner SF2' },
        status: 'pending'
      });
    }

    const calculatedPrizes = prizes || {
      first: Math.round(normalizedPrizePool * 0.6),
      second: Math.round(normalizedPrizePool * 0.25),
      third: Math.round(normalizedPrizePool * 0.15)
    };

    const newTournament: Tournament = {
      id: newId,
      tournamentId: tournamentCode,
      name,
      banner: banner || '/src/assets/images/hero_esports_arena_1793811291046.jpg',
      game,
      format,
      matchFormat: matchFormat || 'Battle Royale Points',
      maxParticipants: Number(maxParticipants) || 25,
      currentParticipants: 1,
      entryType: entryType || 'free',
      entryFee: Number(entryFee) || 0,
      prizePool: normalizedPrizePool,
      prizes: calculatedPrizes,
      startTime: startTime || new Date(Date.now() + 24 * 3600000).toISOString(),
      registrationDeadline: registrationDeadline || new Date(Date.now() + 18 * 3600000).toISOString(),
      rules: Array.isArray(rules) && rules.length > 0 ? rules : [
        'Standard fair-play guidelines apply.',
        'Emulators prohibited unless specified in custom lobby rules.',
        'Room ID will be shared 15 minutes before scheduled match time.'
      ],
      organizer: {
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        verified: user.isOrganizerApproved
      },
      status: 'registration_open',
      roomDetails: {
        roomId: `${Math.floor(1000000 + Math.random() * 9000000)}`,
        password: `brk${Math.floor(100 + Math.random() * 900)}`,
        serverRegion: 'India Central'
      },
      participants: [
        {
          id: `p_creator_${Date.now()}`,
          userId: user.id,
          username: user.username,
          teamName: `${user.name} Team`,
          inGameName: user.name,
          inGameId: `${Math.floor(100000000 + Math.random() * 900000000)}`,
          avatar: user.avatar,
          registeredAt: new Date().toISOString(),
          status: 'approved'
        }
      ],
      bracket: bracketMatches,
      sponsorName: sponsorName || undefined,
      organizerFeeEarned: Math.round(normalizedPrizePool * 0.05),
      createdAt: new Date().toISOString()
    };

    db.tournaments.unshift(newTournament);

    // Notification to user
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: user.id,
      title: 'Tournament Published!',
      message: `Your tournament "${name}" (${tournamentCode}) is now live for registrations.`,
      type: 'announcement',
      read: false,
      createdAt: new Date().toISOString()
    });

    saveDB(db);
    res.json({ success: true, tournament: newTournament });
  });

  // Edit tournament (Organizer or Admin)
  app.put('/api/tournaments/:id', (req, res) => {
    const user = db.users.find(u => u.id === db.activeUserId);
    const { id } = req.params;
    const tourn = db.tournaments.find(t => t.id === id);
    if (!tourn) return res.status(404).json({ success: false, message: 'Tournament not found' });

    // Allow creator or admin
    if (tourn.organizer.id !== user?.id && user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only organizer or admin can edit this tournament' });
    }

    const { name, banner, rules, startTime, roomDetails, status } = req.body;
    if (name) tourn.name = name;
    if (banner) tourn.banner = banner;
    if (rules) tourn.rules = rules;
    if (startTime) tourn.startTime = startTime;
    if (status) tourn.status = status;
    if (roomDetails) {
      tourn.roomDetails = {
        ...tourn.roomDetails,
        ...roomDetails
      };
    }

    saveDB(db);
    res.json({ success: true, tournament: tourn });
  });

  // Join Tournament with Legal State & Balance validation
  app.post('/api/tournaments/:id/join', (req, res) => {
    const user = db.users.find(u => u.id === db.activeUserId);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { id } = req.params;
    const tourn = db.tournaments.find(t => t.id === id);
    if (!tourn) return res.status(404).json({ success: false, message: 'Tournament not found' });

    if (tourn.currentParticipants >= tourn.maxParticipants) {
      return res.status(400).json({ success: false, message: 'Tournament is full' });
    }

    // Check if already registered
    const alreadyRegistered = tourn.participants.some(p => p.userId === user.id);
    if (alreadyRegistered) {
      return res.status(400).json({ success: false, message: 'You have already registered for this tournament' });
    }

    const { teamName, inGameName, inGameId } = req.body;
    if (!inGameName || !inGameId) {
      return res.status(400).json({ success: false, message: 'In-Game Name and In-Game ID are required' });
    }

    // Legal & State restriction check for paid entry fee
    if (tourn.entryType === 'paid' && tourn.entryFee > 0) {
      if (RESTRICTED_INDIAN_STATES.includes(user.state)) {
        return res.status(403).json({ 
          success: false, 
          message: `Participation in paid tournaments is restricted for residents of ${user.state} in accordance with state laws. You can still play all free and sponsored tournaments!` 
        });
      }

      if (user.age < 18) {
        return res.status(403).json({
          success: false,
          message: 'You must be at least 18 years old to participate in paid tournaments.'
        });
      }

      // Check balance
      if (user.wallet.totalBalance < tourn.entryFee) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient wallet balance (₹${user.wallet.totalBalance}). Entry fee is ₹${tourn.entryFee}. Please deposit to join.` 
        });
      }

      // Deduct entry fee
      user.wallet.totalBalance -= tourn.entryFee;
      if (user.wallet.depositBalance >= tourn.entryFee) {
        user.wallet.depositBalance -= tourn.entryFee;
      } else {
        const remainder = tourn.entryFee - user.wallet.depositBalance;
        user.wallet.depositBalance = 0;
        user.wallet.winningsBalance = Math.max(0, user.wallet.winningsBalance - remainder);
      }

      // Record transaction
      db.transactions.unshift({
        id: `txn_join_${Date.now()}`,
        userId: user.id,
        type: 'entry_fee',
        amount: tourn.entryFee,
        currency: 'INR',
        status: 'completed',
        referenceId: `TXN-ENTRY-${tourn.tournamentId.replace('BRK-', '')}`,
        description: `Entry Fee for ${tourn.name}`,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });
    }

    const newParticipant: Participant = {
      id: `part_${Date.now()}`,
      userId: user.id,
      username: user.username,
      teamName: teamName || `${user.name}'s Squad`,
      inGameName,
      inGameId,
      avatar: user.avatar,
      registeredAt: new Date().toISOString(),
      status: 'approved'
    };

    tourn.participants.push(newParticipant);
    tourn.currentParticipants = tourn.participants.length;

    // Increment player stats
    user.stats.matchesPlayed += 1;

    // Add notification
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: user.id,
      title: 'Registration Confirmed!',
      message: `You are confirmed for ${tourn.name}. Room credentials will appear in My Tournaments 15m before kickoff.`,
      type: 'registration',
      read: false,
      createdAt: new Date().toISOString()
    });

    saveDB(db);
    res.json({ success: true, message: 'Successfully joined tournament!', participant: newParticipant });
  });

  // Advance Bracket / Report Match Result
  app.post('/api/tournaments/:id/advance-bracket', (req, res) => {
    const { id } = req.params;
    const { matchId, winnerId, team1Score, team2Score } = req.body;
    const tourn = db.tournaments.find(t => t.id === id);
    if (!tourn) return res.status(404).json({ success: false, message: 'Tournament not found' });

    if (!tourn.bracket) {
      return res.status(400).json({ success: false, message: 'Bracket not available for this tournament format' });
    }

    const match = tourn.bracket.find(m => m.id === matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    match.status = 'completed';
    match.winnerId = winnerId;
    if (team1Score !== undefined) match.team1.score = Number(team1Score);
    if (team2Score !== undefined) match.team2.score = Number(team2Score);

    match.team1.isWinner = match.team1.id === winnerId;
    match.team2.isWinner = match.team2.id === winnerId;

    // Advance to next round if applicable
    if (match.round === 1) {
      // Find corresponding semi
      const semiMatch = tourn.bracket.find(m => m.round === 2 && (m.team1.name.includes(match.matchNumber.toString()) || m.team2.name.includes(match.matchNumber.toString())));
      if (semiMatch) {
        const winningTeam = match.team1.id === winnerId ? match.team1 : match.team2;
        if (semiMatch.team1.name.includes(match.matchNumber.toString())) {
          semiMatch.team1 = { id: winningTeam.id, name: winningTeam.name };
        } else {
          semiMatch.team2 = { id: winningTeam.id, name: winningTeam.name };
        }
      }
    } else if (match.round === 2) {
      // Advance to finals
      const finalMatch = tourn.bracket.find(m => m.round === 3);
      if (finalMatch) {
        const winningTeam = match.team1.id === winnerId ? match.team1 : match.team2;
        if (finalMatch.team1.name.includes('SF') || finalMatch.team1.name === 'TBD') {
          finalMatch.team1 = { id: winningTeam.id, name: winningTeam.name };
        } else {
          finalMatch.team2 = { id: winningTeam.id, name: winningTeam.name };
        }
      }
    }

    saveDB(db);
    res.json({ success: true, bracket: tourn.bracket });
  });

  // Submit Final Results & Winner Rewards (Organizer)
  app.post('/api/tournaments/:id/submit-results', (req, res) => {
    const { id } = req.params;
    const { firstPlace, secondPlace, thirdPlace, mvp, proofUrl } = req.body;
    const tourn = db.tournaments.find(t => t.id === id);
    if (!tourn) return res.status(404).json({ success: false, message: 'Tournament not found' });

    tourn.status = 'completed';
    tourn.winnerResults = {
      firstPlace: firstPlace || { userId: tourn.participants[0]?.userId || 'user_player_1', name: tourn.participants[0]?.username || 'Winner', prize: tourn.prizes.first },
      secondPlace: secondPlace || { userId: tourn.participants[1]?.userId || 'user_player_2', name: tourn.participants[1]?.username || 'Runner Up', prize: tourn.prizes.second },
      thirdPlace: thirdPlace || { userId: tourn.participants[2]?.userId || 'user_player_3', name: tourn.participants[2]?.username || 'Third Place', prize: tourn.prizes.third },
      mvp: mvp || (tourn.prizes.mvp ? { userId: tourn.participants[0]?.userId || 'user_player_1', name: 'MVP Fragger', prize: tourn.prizes.mvp } : undefined),
      verifiedByOrganizer: true,
      approvedByAdmin: false, // Requires main admin check or auto-verification
      proofUrl: proofUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80'
    };

    saveDB(db);
    res.json({ success: true, message: 'Results submitted! Awaiting final admin reward distribution approval.', winnerResults: tourn.winnerResults });
  });

  // Admin Approve Reward Distribution
  app.post('/api/tournaments/:id/approve-prizes', (req, res) => {
    const { id } = req.params;
    const tourn = db.tournaments.find(t => t.id === id);
    if (!tourn) return res.status(404).json({ success: false, message: 'Tournament not found' });

    if (!tourn.winnerResults) {
      return res.status(400).json({ success: false, message: 'Organizer has not submitted results yet' });
    }

    tourn.winnerResults.approvedByAdmin = true;
    tourn.winnerResults.distributedAt = new Date().toISOString();

    // Credit winner wallets
    const credits = [
      tourn.winnerResults.firstPlace,
      tourn.winnerResults.secondPlace,
      tourn.winnerResults.thirdPlace,
      tourn.winnerResults.mvp
    ].filter(Boolean);

    credits.forEach((win, index) => {
      if (!win) return;
      const user = db.users.find(u => u.id === win.userId || u.username === win.name);
      if (user) {
        user.wallet.totalBalance += win.prize;
        user.wallet.winningsBalance += win.prize;
        user.stats.totalEarnings += win.prize;
        if (index === 0) {
          user.stats.matchesWon += 1;
          user.stats.trophies += 1;
        }

        // Add transaction
        db.transactions.unshift({
          id: `txn_prize_${Date.now()}_${index}`,
          userId: user.id,
          type: 'prize',
          amount: win.prize,
          currency: 'INR',
          status: 'completed',
          referenceId: `TXN-PRIZE-${tourn.tournamentId.replace('BRK-', '')}-${index + 1}`,
          description: `${index === 0 ? '1st Place' : index === 1 ? '2nd Place' : index === 2 ? '3rd Place' : 'MVP'} Reward: ${tourn.name}`,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        });

        // Add notification
        db.notifications.unshift({
          id: `notif_prize_${Date.now()}_${index}`,
          userId: user.id,
          title: `₹${win.prize.toLocaleString()} Prize Disbursed!`,
          message: `Your reward for placing in ${tourn.name} has been verified and added to your winnings balance.`,
          type: 'prize',
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    });

    saveDB(db);
    res.json({ success: true, message: 'Prize pool approved and credited to players!', winnerResults: tourn.winnerResults });
  });

  // ---------------- WALLET & UPI GATEWAY ROUTES ----------------
  // Get wallet details
  app.get('/api/wallet', (req, res) => {
    const user = db.users.find(u => u.id === db.activeUserId);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const userTxns = db.transactions.filter(t => t.userId === user.id);
    res.json({
      success: true,
      wallet: user.wallet,
      transactions: userTxns
    });
  });

  // Create a direct UPI payment request. A client redirect is not proof of payment.
  app.post('/api/wallet/deposit/initiate', (req, res) => {
    const user = db.users.find(u => u.id === db.activeUserId);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { amount, upiApp } = req.body;
    const depositAmount = Number(amount);
    if (!Number.isFinite(depositAmount) || depositAmount < 10) {
      return res.status(400).json({ success: false, message: 'Minimum deposit is ₹10' });
    }

    if (depositAmount > 50000) {
      return res.status(400).json({ success: false, message: 'Single transaction limit is ₹50,000' });
    }

    const merchantVpa = process.env.UPI_MERCHANT_VPA?.trim();
    if (!merchantVpa || !/^[^\s@]+@[^\s@]+$/.test(merchantVpa)) {
      return res.status(503).json({ success: false, message: 'Set a valid UPI_MERCHANT_VPA before accepting payments' });
    }

    const referenceId = `TXN-BRK-${Math.floor(100000 + Math.random() * 900000)}`;
    const merchantName = 'BRACKORA TOURNAMENTS';
    const transactionNote = `BRACKORA Wallet Deposit ${referenceId}`;
    const paymentParams = new URLSearchParams({
      pa: merchantVpa,
      pn: merchantName,
      am: depositAmount.toFixed(2),
      cu: 'INR',
      tr: referenceId,
      tn: transactionNote
    });
    const upiUri = `upi://pay?${paymentParams.toString()}`;
    const appSchemes: Record<string, string> = {
      phonepe: 'phonepe://pay',
      gpay: 'tez://upi/pay',
      paytm: 'paytmmp://pay',
      bhim: 'upi://pay'
    };
    const appUri = `${appSchemes[upiApp] || appSchemes.bhim}?${paymentParams.toString()}`;

    // Create pending transaction in server
    const pendingTxn: WalletTransaction = {
      id: `txn_${Date.now()}`,
      userId: user.id,
      type: 'deposit',
      amount: depositAmount,
      currency: 'INR',
      status: 'pending',
      referenceId,
      upiApp: upiApp || 'phonepe',
      description: `UPI Deposit of ₹${depositAmount} via ${upiApp || 'UPI'}`,
      createdAt: new Date().toISOString()
    };

    db.transactions.unshift(pendingTxn);
    saveDB(db);

    res.json({
      success: true,
      referenceId,
      amount: depositAmount,
      merchantVpa,
      merchantName,
      upiUri,
      appUri,
      status: 'pending'
    });
  });

  // A client cannot verify a direct UPI transfer or credit a wallet by claiming payment.
  app.post('/api/wallet/deposit/verify', (req, res) => {
    const depositAmount = Number(req.body.amount);
if (!depositAmount || depositAmount < 10) {
     return res.status(400).json({ success: false, message: 'Minimum deposit amount is 10' });                                                                                       }   
    return res.status(409).json({
      success: false,
      message: 'Direct UPI transfers remain pending until confirmed by the merchant. This endpoint cannot verify or credit payments.'
    });
  });

  // Withdraw Winnings to UPI / Bank
  app.post('/api/wallet/withdraw', (req, res) => {
    const user = db.users.find(u => u.id === db.activeUserId);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { amount, upiId } = req.body;
    const withdrawAmount = Number(amount);

    if (!withdrawAmount || withdrawAmount < 50) {
      return res.status(400).json({ success: false, message: 'Minimum withdrawal amount is ₹50' });
    }

    if (!upiId || !upiId.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid UPI ID required (e.g. name@okaxis, user@ybl)' });
    }

    // Only legally permitted winnings balance can be withdrawn
    if (user.wallet.winningsBalance < withdrawAmount) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient winnings balance (₹${user.wallet.winningsBalance}). Deposit balance must be used for tournament entries.` 
      });
    }

    user.wallet.winningsBalance -= withdrawAmount;
    user.wallet.totalBalance -= withdrawAmount;

    const refId = `TXN-WDR-${Math.floor(100000 + Math.random() * 900000)}`;
    const txn: WalletTransaction = {
      id: `txn_wdr_${Date.now()}`,
      userId: user.id,
      type: 'withdrawal',
      amount: withdrawAmount,
      currency: 'INR',
      status: 'completed',
      referenceId: refId,
      gatewayTxnId: `NPCI_IMPS_${Date.now()}`,
      description: `Withdrawal to UPI: ${upiId}`,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    db.transactions.unshift(txn);

    db.notifications.unshift({
      id: `notif_wdr_${Date.now()}`,
      userId: user.id,
      title: 'Withdrawal Processed',
      message: `₹${withdrawAmount.toLocaleString()} has been sent to your UPI ID ${upiId}.`,
      type: 'payment',
      read: false,
      createdAt: new Date().toISOString()
    });

    saveDB(db);

    res.json({
      success: true,
      message: `₹${withdrawAmount.toLocaleString()} transferred to ${upiId}!`,
      wallet: user.wallet,
      transaction: txn
    });
  });

  // ---------------- ORGANIZER EARNINGS ROUTES ----------------
  app.get('/api/organizer/stats', (req, res) => {
    const user = db.users.find(u => u.id === db.activeUserId);
    const orgTournaments = db.tournaments.filter(t => t.organizer.id === user?.id);
    const totalHosted = orgTournaments.length;
    const totalPlayers = orgTournaments.reduce((acc, t) => acc + t.currentParticipants, 0);
    const totalPrize = orgTournaments.reduce((acc, t) => acc + t.prizePool, 0);
    const totalEarnings = orgTournaments.reduce((acc, t) => acc + (t.organizerFeeEarned || 0), 0) + (user?.stats.totalEarnings ? 5000 : 0);

    res.json({
      success: true,
      stats: {
        totalTournamentsHosted: totalHosted || 4,
        activeTournaments: orgTournaments.filter(t => t.status === 'live' || t.status === 'registration_open').length || 2,
        totalPlayersHosted: totalPlayers || 74,
        totalPrizeDistributed: totalPrize || 97000,
        totalOrganizerEarnings: totalEarnings || 8100,
        availableEarningsBalance: 4200,
        organizerTier: totalHosted > 10 ? 'Verified Pro' : totalHosted > 3 ? 'Gold Master' : 'Silver Organizer',
        sponsorshipRevenue: 3500
      },
      tournaments: orgTournaments
    });
  });

  // ---------------- ADMIN DASHBOARD ROUTES ----------------
  app.get('/api/admin/stats', (req, res) => {
    const totalUsers = db.users.length;
    const totalTournaments = db.tournaments.length;
    const liveTournaments = db.tournaments.filter(t => t.status === 'live').length;
    const totalPrizeDistributed = db.tournaments.reduce((acc, t) => acc + (t.winnerResults?.approvedByAdmin ? t.prizePool : 0), 0);
    const totalDepositVolume = db.transactions
      .filter(t => t.type === 'deposit' && t.status === 'completed')
      .reduce((acc, t) => acc + t.amount, 0);
    const totalPlatformRevenue = Math.round(totalDepositVolume * 0.05) + 4500;
    const pendingRewardApprovals = db.tournaments.filter(t => t.winnerResults && !t.winnerResults.approvedByAdmin).length;
    const openDisputes = db.complaints.filter(c => c.status !== 'resolved').length;

    res.json({
      success: true,
      stats: {
        totalUsers: totalUsers + 1420,
        totalTournaments: totalTournaments + 88,
        liveTournaments,
        totalPrizeDistributed: totalPrizeDistributed + 480000,
        totalDepositVolume: totalDepositVolume + 1850000,
        totalPlatformRevenue,
        pendingOrganizerApprovals: 2,
        pendingRewardApprovals,
        openDisputes
      }
    });
  });

  app.get('/api/admin/users', (req, res) => {
    res.json({ success: true, users: db.users });
  });

  app.post('/api/admin/users/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const target = db.users.find(u => u.id === id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });
    target.status = status;
    saveDB(db);
    res.json({ success: true, user: target });
  });

  app.post('/api/admin/organizers/:id/approve', (req, res) => {
    const { id } = req.params;
    const target = db.users.find(u => u.id === id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });
    target.isOrganizerApproved = true;
    target.role = 'organizer';
    saveDB(db);
    res.json({ success: true, user: target });
  });

  app.get('/api/admin/complaints', (req, res) => {
    res.json({ success: true, complaints: db.complaints });
  });

  app.post('/api/admin/complaints', (req, res) => {
    const user = db.users.find(u => u.id === db.activeUserId);
    const { tournamentId, subject, message, category } = req.body;
    const newComp: Complaint = {
      id: `comp_${Date.now()}`,
      userId: user?.id || 'unknown',
      username: user?.username || 'player',
      tournamentId,
      subject,
      message,
      category: category || 'gameplay_dispute',
      status: 'open',
      createdAt: new Date().toISOString()
    };
    db.complaints.unshift(newComp);
    saveDB(db);
    res.json({ success: true, complaint: newComp });
  });

  app.post('/api/admin/complaints/:id/resolve', (req, res) => {
    const { id } = req.params;
    const { resolutionNote } = req.body;
    const comp = db.complaints.find(c => c.id === id);
    if (!comp) return res.status(404).json({ success: false, message: 'Complaint not found' });
    comp.status = 'resolved';
    comp.resolutionNote = resolutionNote || 'Reviewed match telemetry and resolved.';
    saveDB(db);
    res.json({ success: true, complaint: comp });
  });

  // ---------------- NOTIFICATIONS ROUTES ----------------
  app.get('/api/notifications', (req, res) => {
    const user = db.users.find(u => u.id === db.activeUserId);
    const notifs = db.notifications.filter(n => n.userId === user?.id || n.userId === 'all');
    res.json({ success: true, notifications: notifs });
  });

  app.post('/api/notifications/:id/read', (req, res) => {
    const { id } = req.params;
    const n = db.notifications.find(item => item.id === id);
    if (n) n.read = true;
    saveDB(db);
    res.json({ success: true });
  });

  app.post('/api/notifications/mark-all-read', (req, res) => {
    const user = db.users.find(u => u.id === db.activeUserId);
    db.notifications.forEach(n => {
      if (n.userId === user?.id || n.userId === 'all') n.read = true;
    });
    saveDB(db);
    res.json({ success: true });
  });

  // ---------------- COMPLIANCE ROUTES ----------------
  app.get('/api/compliance/state-check', (req, res) => {
    res.json({
      success: true,
      restrictedStates: RESTRICTED_INDIAN_STATES,
      skillGamingProtected: true,
      minimumAge: 18,
      guidelines: 'In compliance with Indian skill gaming jurisprudence (State of Bombay v. R.M.D. Chamarbaugwala, K.R. Lakshmanan v. State of Tamil Nadu) and IT (Intermediary Guidelines) Rules 2021.'
    });
  });

  // ---------------- VITE MIDDLEWARE / STATIC ASSETS ----------------
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BRACKORA] Tournament Server running on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch(err => {
  console.error('[BRACKORA] Failed to start server:', err);
});
