import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Route, Switch, useLocation } from 'wouter';
import { RakshakAssistant } from './pages/RakshakAssistant';
import { FloatingAskRakshak } from './components/FloatingAskRakshak';
import ScanCrop from './pages/ScanCrop';
import {
  Activity as ActivityIcon,
  AlertTriangle,
  ArrowRight,
  Bell,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  CloudRain,
  CloudSun,
  Cpu,
  Database,
  Droplets,
  ExternalLink,
  Eye,
  FileText,
  FlaskConical,
  GraduationCap,
  History,
  Info,
  Languages,
  LayoutDashboard,
  Leaf,
  Lightbulb,
  LocateFixed,
  Lock,
  LogOut,
  Map as MapIcon,
  MapPin,
  Menu,
  MessageCircle,
  Mic,
  MicOff,
  Plus,
  QrCode,
  RefreshCw,
  ScanLine,
  Send,
  Server,
  Settings as SettingsIcon,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sprout,
  ThermometerSun,
  TrendingUp,
  Upload,
  User,
  Users,
  Volume2,
  VolumeX,
  Wind,
  X,
} from 'lucide-react';

import { DigitalTwinMap, PartitionMapData } from './components/DigitalTwinMap';
import { AppLanguage, SUPPORTED_LANGUAGES, TRANSLATIONS, TranslationDictionary } from './lib/translations';

// ==========================================
// Types & Interfaces
// ==========================================

export type AuthRole = 'Farmer' | 'Educator' | 'Authority' | 'Administrator';

export type DemoAccount = {
  username: string;
  password: string;
  role: AuthRole;
  name: string;
  village: string;
  preferredLanguage: AppLanguage;
  description: string;
};

export type AuthSession = {
  username: string;
  role: AuthRole;
  name: string;
  village: string;
  preferredLanguage: AppLanguage;
  authenticatedAt: string;
};

export type Field = {
  id: string;
  name: string;
  crop: string;
  stage: string;
  area: number;
  location: string;
  soil: string;
  waterStatus: string;
  soilMoisture: number;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  updatedAt: string;
  boundary?: [number, number][];
};

export type DiseaseScan = {
  disease: string;
  confidence: number;
  severity: string;
  evidence: string;
  action: string;
  scannedAt: string;
  modelStatus?: string;
};

export type Recommendation = {
  id?: string;
  title: string;
  priority: string;
  explanation: string;
  action: string;
  timing: string;
  cost: string;
  benefit: string;
  potentialLoss: string;
  ratio: string;
  sourceLabel: string;
  confidence: number;
};

export type FarmerActivity = {
  type: string;
  date: string;
  note: string;
};

export type FarmNotification = {
  id: string;
  type: 'rain' | 'pest-risk' | 'disease-risk' | 'low-moisture' | 'recommendation-due' | 'follow-up';
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  farmId: string;
  partitionId: string;
  fieldId: string;
  fieldName: string;
  why: string;
  action: string;
  read: boolean;
};

export type FarmStateSnapshot = {
  farmId: string;
  partitionId: string;
  name: string;
  crop: string;
  cropStage: string;
  weather: {
    temperature: number;
    humidity: number;
    rainfallChance: number;
    condition: string;
  };
  sensor: {
    soilMoisture: number;
    ph: number;
    nitrogen: string;
    phosphorus?: number;
    potassium?: number;
  };
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  metadata?: Record<string, unknown>;
};

// ==========================================
// Constants & Seed Data
// ==========================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const LANGUAGE_STORAGE_KEY = 'farmrakshak-language';
const AUTH_SESSION_KEY = 'farmrakshak-auth-session';

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    username: 'farmer@farmrakshak.demo',
    password: 'farmer123',
    role: 'Farmer',
    name: 'Ramesh Patil',
    village: 'Nandgaon, Nashik District, Maharashtra',
    preferredLanguage: 'mr',
    description: 'Owns 4 active partitions (Cotton, Tomato, Potato, Chickpea). Focuses on daily operational decisions.',
  },
  {
    username: 'educator@farmrakshak.demo',
    password: 'educator123',
    role: 'Educator',
    name: 'Dr. Ananya Sharma',
    village: 'MPKV Agricultural Learning & Research Center',
    preferredLanguage: 'en',
    description: 'Agricultural trainer reviewing anonymized farm cases and demonstration trial plots.',
  },
  {
    username: 'authority@farmrakshak.demo',
    password: 'authority123',
    role: 'Authority',
    name: 'Regional Agriculture Officer',
    village: 'Maharashtra State Agriculture Department',
    preferredLanguage: 'en',
    description: 'Regional monitoring scope across Nashik, Pune, and Ahmednagar districts with hotspot alerts.',
  },
  {
    username: 'admin@farmrakshak.demo',
    password: 'admin123',
    role: 'Administrator',
    name: 'System Administrator',
    village: 'FarmRakshak Central Telemetry HQ',
    preferredLanguage: 'en',
    description: 'Global system visibility, ML model health telemetry, user access scopes, and API monitoring.',
  },
];

const DEFAULT_FIELDS: Field[] = [
  {
    id: 'field-01',
    name: 'North Block',
    crop: 'Cotton',
    stage: 'Flowering · Day 44',
    area: 2.4,
    location: 'Nandgaon · 18.672° N, 74.242° E',
    soil: 'Black cotton soil',
    waterStatus: 'Moisture below ideal',
    soilMoisture: 31,
    riskScore: 62,
    riskLevel: 'High',
    updatedAt: '8 min ago',
  },
  {
    id: 'field-02',
    name: 'Wellside Plot',
    crop: 'Potato',
    stage: 'Bulbing · Day 71',
    area: 1.1,
    location: 'Nandgaon · 18.670° N, 74.243° E',
    soil: 'Sandy loam',
    waterStatus: 'Within range',
    soilMoisture: 55,
    riskScore: 28,
    riskLevel: 'Low',
    updatedAt: '22 min ago',
  },
  {
    id: 'field-03',
    name: 'East Terrace',
    crop: 'Tomato',
    stage: 'Vegetative · Day 29',
    area: 1.8,
    location: 'Nandgaon · 18.672° N, 74.247° E',
    soil: 'Medium black soil',
    waterStatus: 'Stable',
    soilMoisture: 42,
    riskScore: 41,
    riskLevel: 'Medium',
    updatedAt: '1 hr ago',
  },
  {
    id: 'field-04',
    name: 'South Acre',
    crop: 'Chickpea',
    stage: 'Vegetative · Day 15',
    area: 1.5,
    location: 'Nandgaon · 18.669° N, 74.246° E',
    soil: 'Loam soil',
    waterStatus: 'Good moisture',
    soilMoisture: 38,
    riskScore: 18,
    riskLevel: 'Low',
    updatedAt: '2 hrs ago',
  },
];

const FARM_FIELD_PARTITIONS: Record<string, { farmId: string; partitionId: string }> = {
  'field-01': { farmId: 'farm-01', partitionId: 'partition-02' },
  'field-02': { farmId: 'farm-01', partitionId: 'partition-03' },
  'field-03': { farmId: 'farm-01', partitionId: 'partition-01' },
  'field-04': { farmId: 'farm-01', partitionId: 'partition-04' },
};

const DEFAULT_SCAN: DiseaseScan = {
  disease: 'Bacterial leaf spot',
  confidence: 82.4,
  severity: 'Early · Manageable',
  evidence: 'Small brown necrotic lesions on lower leaves with distinct yellow halo.',
  action: 'Remove infected bottom leaves, avoid overhead watering, and monitor drainage before rainfall.',
  scannedAt: 'Today, 09:42',
  modelStatus: 'PlantVillage MobileNetV3 PyTorch Scripted Model',
};

const DEFAULT_ACTIVITIES: FarmerActivity[] = [
  { type: 'Sensor check', date: 'Today · 09:31', note: 'North Block soil moisture reading logged at 31% via IoT Probe #01.' },
  { type: 'Disease scan', date: 'Today · 09:42', note: 'Leaf scan detected early bacterial leaf spot (82.4% confidence).' },
  { type: 'Field walk', date: 'Yesterday · 17:10', note: 'Walked North Block after afternoon wind gusts.' },
  { type: 'Irrigation', date: '12 Jun · 06:40', note: 'Light drip irrigation cycle completed for Wellside Plot.' },
];

const DEFAULT_NOTIFICATIONS: FarmNotification[] = [
  {
    id: 'notification-01',
    type: 'disease-risk',
    title: 'Bacterial leaf spot detected',
    severity: 'high',
    timestamp: 'Today · 09:42',
    farmId: 'farm-01',
    partitionId: 'partition-02',
    fieldId: 'field-01',
    fieldName: 'North Block',
    why: 'Latest AI vision scan classified bacterial leaf spot with 82.4% confidence in lower canopy.',
    action: 'Inspect lower leaf rows and delay overhead watering.',
    read: false,
  },
  {
    id: 'notification-02',
    type: 'low-moisture',
    title: 'Soil moisture below crop target',
    severity: 'medium',
    timestamp: 'Today · 09:31',
    farmId: 'farm-01',
    partitionId: 'partition-02',
    fieldId: 'field-01',
    fieldName: 'North Block',
    why: 'Moisture probe #01 reads 31% (crop flowering target is 38-45%).',
    action: 'Review rain window (42% chance) before applying light irrigation.',
    read: false,
  },
  {
    id: 'notification-03',
    type: 'rain',
    title: 'Rain window forecast advisory',
    severity: 'medium',
    timestamp: 'Today · 08:15',
    farmId: 'farm-01',
    partitionId: 'partition-02',
    fieldId: 'field-01',
    fieldName: 'North Block',
    why: 'Rain is forecast within the next 18-24 hours. Foliar sprays will be washed off.',
    action: 'Postpone chemical spray applications until after rain clears.',
    read: true,
  },
  {
    id: 'notification-04',
    type: 'follow-up',
    title: 'Follow-up observation due',
    severity: 'low',
    timestamp: 'Yesterday · 17:10',
    farmId: 'farm-01',
    partitionId: 'partition-03',
    fieldId: 'field-02',
    fieldName: 'Wellside Plot',
    why: 'Routine 48-hour health follow-up helps confirm steady tuber bulbing.',
    action: 'Inspect quadrant and log status in timeline.',
    read: false,
  },
];

// ==========================================
// Language Context & Hooks
// ==========================================

function getStoredLanguage(): AppLanguage {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(LANGUAGE_STORAGE_KEY) : null;
  if (stored === 'hi' || stored === 'te' || stored === 'mr') return stored;
  return 'en';
}

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(getStoredLanguage);

  useEffect(() => {
    const handleStorage = () => setLanguageState(getStoredLanguage());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setLanguage = (nextLang: AppLanguage) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);
    setLanguageState(nextLang);
    window.dispatchEvent(new CustomEvent('farmrakshak-language-change', { detail: nextLang }));
  };

  const t = (key: string): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || key;
  };

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

// ==========================================
// Auth Context & Hooks
// ==========================================

type AuthContextValue = {
  session: AuthSession | null;
  authenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_SESSION_KEY);
      return saved ? (JSON.parse(saved) as AuthSession) : null;
    } catch {
      return null;
    }
  });

  const login = (username: string, password: string): boolean => {
    const acc = DEMO_ACCOUNTS.find(
      (item) => item.username.toLowerCase() === username.trim().toLowerCase() && item.password === password
    );
    if (!acc) return false;

    const newSession: AuthSession = {
      username: acc.username,
      role: acc.role,
      name: acc.name,
      village: acc.village,
      preferredLanguage: acc.preferredLanguage,
      authenticatedAt: new Date().toISOString(),
    };

    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(newSession));
    localStorage.setItem(LANGUAGE_STORAGE_KEY, acc.preferredLanguage);
    setSession(newSession);
    return true;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_SESSION_KEY);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, authenticated: session !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ==========================================
// Voice STT / TTS Service
// ==========================================

const VoiceService = {
  speak: (text: string, language: AppLanguage) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const langMap: Record<AppLanguage, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      te: 'te-IN',
      mr: 'mr-IN',
    };
    utterance.lang = langMap[language] || 'en-IN';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  },

  stopSpeaking: () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  },
};

// ==========================================
// API Helpers
// ==========================================

async function fetchFarmState(fieldId: string): Promise<FarmStateSnapshot | null> {
  const mapping = FARM_FIELD_PARTITIONS[fieldId] || { farmId: 'farm-01', partitionId: 'partition-02' };
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/farm-state?farm_id=${encodeURIComponent(mapping.farmId)}&partition_id=${encodeURIComponent(mapping.partitionId)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      farmId: data.farm_id,
      partitionId: data.partition_id,
      name: data.name,
      crop: data.crop,
      cropStage: data.crop_stage,
      weather: {
        temperature: Number(data.weather?.temperature_c ?? 29),
        humidity: Number(data.weather?.humidity_pct ?? 68),
        rainfallChance: Number(data.weather?.rainfall_chance_pct ?? 42),
        condition: String(data.weather?.condition ?? 'Cloud cover building'),
      },
      sensor: {
        soilMoisture: Number(data.soil?.moisture_pct ?? 31),
        ph: Number(data.soil?.ph ?? 6.7),
        nitrogen: `${data.soil?.nitrogen ?? 49} kg/ha (Medium)`,
        phosphorus: Number(data.soil?.phosphorus ?? 37),
        potassium: Number(data.soil?.potassium ?? 51),
      },
      riskScore: Number(data.risk_score ?? 62),
      riskLevel: data.risk_level as 'Low' | 'Medium' | 'High',
      metadata: data.metadata,
    };
  } catch {
    return null;
  }
}

async function requestAssistantReply(data: {
  message: string;
  fieldName: string;
  soilMoisture: number;
  rainfallChance: number;
  diseaseConfidence: number;
  farmId?: string;
  partitionId?: string;
  language?: string;
  role?: string;
}) {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const json = await res.json();
      return { answer: json.reply || json.answer };
    }
  } catch {}

  try {
    const res = await fetch(`${API_BASE_URL}/api/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return res.json();
  } catch {}

  return { answer: 'Rakshak AI is grounded in your field and ready to advise you.' };
}

async function requestPlantScan(fileName: string, base64Image?: string) {
  const res = await fetch(`${API_BASE_URL}/api/plant-scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, imageBytes: base64Image }),
  });
  if (!res.ok) throw new Error('Plant scan API failed');
  return res.json();
}

async function requestProductSuitability(identifier: string, farmId = 'farm-01', partitionId = 'partition-02') {
  const res = await fetch(`${API_BASE_URL}/api/product-suitability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, farmId, partitionId }),
  });
  if (!res.ok) throw new Error('Product suitability API failed');
  return res.json();
}

async function requestRecommendation(farmId = 'farm-01', partitionId = 'partition-02') {
  const res = await fetch(`${API_BASE_URL}/api/recommendation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ farmId, partitionId }),
  });
  if (!res.ok) throw new Error('Recommendation API failed');
  return res.json();
}

async function requestRisk(farmId = 'farm-01', partitionId = 'partition-02') {
  const res = await fetch(`${API_BASE_URL}/api/risk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ farmId, partitionId }),
  });
  if (!res.ok) throw new Error('Risk API failed');
  return res.json();
}

async function requestYieldPrediction(data: {
  crop: string;
  year: number;
  season: string;
  state: string;
  area: number;
  production?: number;
  fertilizer: number;
  pesticide: number;
}) {
  const res = await fetch(`${API_BASE_URL}/api/predict/yield`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Yield prediction API failed');
  return res.json();
}

async function fetchRegionalOverview(region = 'Maharashtra') {
  const res = await fetch(`${API_BASE_URL}/api/regional-overview?region=${encodeURIComponent(region)}`);
  if (!res.ok) throw new Error('Regional overview failed');
  return res.json();
}

async function fetchEducatorCases() {
  const res = await fetch(`${API_BASE_URL}/api/educator-cases`);
  if (!res.ok) throw new Error('Educator cases failed');
  return res.json();
}

async function fetchAdminSystemStatus() {
  const res = await fetch(`${API_BASE_URL}/api/admin/system-status`);
  if (!res.ok) throw new Error('Admin system status failed');
  return res.json();
}

// ==========================================
// UI Components
// ==========================================

function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  return (
    <div style={{ display: 'flex', gap: 4, background: 'hsl(var(--muted) / 0.8)', padding: 3, borderRadius: 8 }}>
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => setLanguage(lang.code)}
          style={{
            border: 0,
            padding: '4px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            background: language === lang.code ? 'hsl(var(--primary))' : 'transparent',
            color: language === lang.code ? '#ffffff' : 'hsl(var(--foreground))',
            transition: 'all 0.15s ease',
          }}
          data-testid={`lang-btn-${lang.code}`}
        >
          {lang.native}
        </button>
      ))}
    </div>
  );
}

function RoleBadge({ role }: { role: AuthRole }) {
  const { t } = useLanguage();
  const config: Record<AuthRole, { key: string; bg: string; color: string }> = {
    Farmer: { key: 'role.farmer.scope', bg: '#05966920', color: '#059669' },
    Educator: { key: 'role.educator.scope', bg: '#7c3aed20', color: '#7c3aed' },
    Authority: { key: 'role.authority.scope', bg: '#0284c720', color: '#0284c7' },
    Administrator: { key: 'role.admin.scope', bg: '#dc262620', color: '#dc2626' },
  };
  const conf = config[role] || config.Farmer;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: conf.bg, color: conf.color }}>
      {t(conf.key)}
    </span>
  );
}

function PartitionSelector({
  fields,
  currentFieldId,
  onSelect,
}: {
  fields: Field[];
  currentFieldId: string;
  onSelect: (id: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'hsl(var(--card))', padding: '6px 12px', borderRadius: 10, border: '1px solid hsl(var(--border))' }}>
      <Sprout size={16} color="#10b981" />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', fontWeight: 700 }}>
          {t('dashboard.activePartition')}
        </span>
        <select
          value={currentFieldId}
          onChange={(e) => onSelect(e.target.value)}
          style={{ background: 'transparent', border: 0, fontWeight: 700, fontSize: 13, color: 'hsl(var(--foreground))', cursor: 'pointer', outline: 'none' }}
          data-testid="select-active-partition"
        >
          {fields.map((f) => (
            <option key={f.id} value={f.id} style={{ background: '#1e293b', color: '#fff' }}>
              {f.name} · {f.crop} ({f.stage})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ==========================================
// Layout Shell
// ==========================================

function AppShell({
  children,
  fields,
  currentFieldId,
  onSelectField,
  unreadCount = 0,
}: {
  children: React.ReactNode;
  fields: Field[];
  currentFieldId: string;
  onSelectField: (id: string) => void;
  unreadCount?: number;
}) {
  const [location, setLocation] = useLocation();
  const { session, logout } = useAuth();
  const { t } = useLanguage();
  const role = session?.role || 'Farmer';

  const navLinks = useMemo(() => {
    if (role === 'Educator') {
      return [
        { href: '/dashboard', label: t('role.educator.overview'), icon: GraduationCap },
        { href: '/digital-twin', label: t('role.educator.twin'), icon: MapIcon },
        { href: '/fields', label: t('role.educator.cases'), icon: FileText },
        { href: '/yield', label: t('nav.yield'), icon: TrendingUp },
        { href: '/assistant', label: t('nav.assistant'), icon: MessageCircle },
        { href: '/settings', label: t('nav.settings'), icon: SettingsIcon },
      ];
    }
    if (role === 'Authority') {
      return [
        { href: '/dashboard', label: t('role.authority.overview'), icon: Shield },
        { href: '/digital-twin', label: t('role.authority.twin'), icon: MapIcon },
        { href: '/fields', label: t('role.authority.hotspots'), icon: ShieldAlert },
        { href: '/yield', label: t('nav.yield'), icon: TrendingUp },
        { href: '/notifications', label: t('nav.notifications'), icon: Bell },
        { href: '/settings', label: t('nav.settings'), icon: SettingsIcon },
      ];
    }
    if (role === 'Administrator') {
      return [
        { href: '/dashboard', label: t('role.admin.overview'), icon: Server },
        { href: '/digital-twin', label: t('nav.digitalTwin'), icon: MapIcon },
        { href: '/fields', label: t('fields.title'), icon: Database },
        { href: '/yield', label: t('nav.yield'), icon: TrendingUp },
        { href: '/settings', label: t('nav.settings'), icon: SettingsIcon },
      ];
    }
    // Farmer Links
    return [
      { href: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
      { href: '/digital-twin', label: t('nav.digitalTwin'), icon: MapIcon },
      { href: '/fields', label: t('nav.fields'), icon: Sprout },
      { href: '/scan', label: t('nav.scan'), icon: ScanLine },
      { href: '/qr', label: t('nav.qr'), icon: QrCode },
      { href: '/risk', label: t('nav.risk'), icon: ShieldAlert },
      { href: '/recommendations', label: t('nav.recommendations'), icon: Lightbulb },
      { href: '/weather', label: t('nav.weather'), icon: CloudSun },
      { href: '/yield', label: t('nav.yield'), icon: TrendingUp },
      { href: '/activities', label: t('nav.activities'), icon: History },
      { href: '/assistant', label: t('nav.assistant'), icon: MessageCircle },
      { href: '/notifications', label: t('nav.notifications'), icon: Bell },
      { href: '/settings', label: t('nav.settings'), icon: SettingsIcon },
    ];
  }, [role, t]);

  const isActive = (href: string) => location === href || (href !== '/dashboard' && location.startsWith(href));

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <Link href="/dashboard" className="brand-mark" data-testid="link-brand">
          <span className="brand-icon">
            <Sprout size={20} color="#34d399" />
          </span>
          <span>
            <span className="brand-name">{t('brand.name')}</span>
            <span className="brand-sub">{t('brand.subtitle')}</span>
          </span>
        </Link>

        {session && (
          <div style={{ padding: '0 16px 12px', borderBottom: '1px solid hsl(var(--border))', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{session.name}</div>
            <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>{session.village}</div>
            <div style={{ marginTop: 6 }}>
              <RoleBadge role={session.role} />
            </div>
          </div>
        )}

        <div className="nav-label">{t('nav.mainNavigation')}</div>
        <nav className="nav-list" aria-label="Main Navigation">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-item ${isActive(href) ? 'active' : ''}`}
              data-testid={`nav-${href.replace('/', '')}`}
            >
              <Icon size={18} />
              <span>{label}</span>
              {href === '/notifications' && unreadCount > 0 && (
                <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>
                  {unreadCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', padding: '16px 12px 12px', borderTop: '1px solid hsl(var(--border))' }}>
          <button
            type="button"
            className="nav-item"
            onClick={() => {
              logout();
              setLocation('/login');
            }}
            style={{ width: '100%', color: '#ef4444', border: 0, background: 'transparent', cursor: 'pointer' }}
            data-testid="button-logout"
          >
            <LogOut size={18} />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-area">
        {/* Top Header Bar */}
        <header className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {role === 'Farmer' && (
              <PartitionSelector fields={fields} currentFieldId={currentFieldId} onSelect={onSelectField} />
            )}
            {role !== 'Farmer' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>
                <MapPin size={15} color="#10b981" />
                <span>{session?.village}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LanguageSwitcher />

            <Link href="/notifications" className="icon-btn" style={{ position: 'relative' }} data-testid="link-topbar-notifications">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
              )}
            </Link>

            <Link href="/assistant" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }} data-testid="btn-topbar-rakshak">
              <MessageCircle size={14} color="#10b981" />
              <span>{t('dashboard.askRakshak')}</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                logout();
                setLocation('/login');
              }}
              className="icon-btn"
              title={t('nav.logout')}
              style={{ color: '#ef4444' }}
              data-testid="btn-topbar-logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <div style={{ padding: '24px 28px', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

// ==========================================
// Pages: 1. Login Page
// ==========================================

function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [username, setUsername] = useState('farmer@farmrakshak.demo');
  const [password, setPassword] = useState('farmer123');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      setLocation('/dashboard');
    } else {
      setError(t('auth.invalid'));
    }
  };

  const handleSelectDemo = (acc: DemoAccount) => {
    setUsername(acc.username);
    setPassword(acc.password);
    if (login(acc.username, acc.password)) {
      setLocation('/dashboard');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at top, #0f2e22 0%, #061510 100%)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 480, background: 'hsl(var(--card) / 0.95)', backdropFilter: 'blur(12px)', border: '1px solid hsl(var(--border))', borderRadius: 18, padding: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: '#059669', display: 'grid', placeItems: 'center', margin: '0 auto 12px', boxShadow: '0 8px 16px rgba(5,150,105,0.35)' }}>
            <Sprout size={28} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'hsl(var(--foreground))' }}>{t('brand.name')}</h1>
          <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>{t('auth.tagline')}</p>
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
            <LanguageSwitcher />
          </div>
        </div>

        {error && (
          <div style={{ background: '#ef444420', border: '1px solid #ef444440', color: '#ef4444', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))', display: 'block', marginBottom: 6 }}>
              {t('auth.username')}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
              style={{ width: '100%' }}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))', display: 'block', marginBottom: 6 }}>
              {t('auth.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              style={{ width: '100%' }}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: 6, width: '100%', padding: '12px' }} data-testid="button-signin">
            {t('auth.signIn')} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid hsl(var(--border))' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))', marginBottom: 10, textAlign: 'center' }}>
            {t('auth.demoAccounts')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.username}
                type="button"
                onClick={() => handleSelectDemo(acc)}
                className="card"
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  border: '1px solid hsl(var(--border))',
                  textAlign: 'left',
                  background: 'hsl(var(--muted) / 0.5)',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{acc.name}</div>
                  <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{acc.village}</div>
                </div>
                <RoleBadge role={acc.role} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Pages: 2. Farmer Dashboard
// ==========================================

function FarmerDashboard({
  fields,
  currentFieldId,
  onSelectField,
  farmState,
}: {
  fields: Field[];
  currentFieldId: string;
  onSelectField: (id: string) => void;
  farmState: FarmStateSnapshot | null;
}) {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const currentField = fields.find((f) => f.id === currentFieldId) || fields[0];

  const partitionsMapData: PartitionMapData[] = fields.map((f) => ({
    id: f.id,
    name: f.name,
    crop: f.crop,
    stage: f.stage,
    area: f.area,
    riskScore: f.riskScore,
    riskLevel: f.riskLevel,
    soilMoisture: f.soilMoisture,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero: Today's Critical Decision */}
      <section className="hero-panel" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)', borderRadius: 16, padding: '24px 28px', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ maxWidth: 680 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.18)', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
              <Sparkles size={13} color="#fde047" />
              <span>{t('dashboard.todayDecision')} · {currentField.name} ({currentField.crop})</span>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.3 }}>
              {t('dashboard.heroTitle')}
            </h2>
            <p style={{ fontSize: 14, opacity: 0.9, marginTop: 8, lineHeight: 1.5 }}>
              {t('dashboard.heroDesc')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignSelf: 'center' }}>
            <button className="btn btn-secondary" onClick={() => setLocation('/recommendations')} data-testid="btn-hero-action">
              {t('nav.recommendations')} <ArrowRight size={15} />
            </button>
            <button className="btn btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }} onClick={() => setLocation('/scan')} data-testid="btn-hero-scan">
              <ScanLine size={15} /> {t('scan.title')}
            </button>
          </div>
        </div>
      </section>

      {/* Grid: 4 Metric Cards */}
      <div className="grid grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {/* Risk Gauge */}
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{t('dashboard.risk')}</span>
            <ShieldAlert size={18} color={currentField.riskScore > 60 ? '#ef4444' : '#10b981'} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: currentField.riskScore > 60 ? '#ef4444' : '#10b981' }}>
              {farmState?.riskScore ?? currentField.riskScore}
            </span>
            <span style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>/ 100</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>
            {t('dashboard.level')} <strong>{farmState?.riskLevel ?? currentField.riskLevel}</strong>
          </span>
        </div>

        {/* Soil Moisture */}
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{t('weather.soilMoisture')}</span>
            <Droplets size={18} color="#0284c7" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: '#0284c7' }}>
              {farmState?.sensor.soilMoisture ?? currentField.soilMoisture}%
            </span>
            <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{t('dashboard.probeLabel')}</span>
          </div>
          <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>{t('dashboard.moistureTarget')}</span>
        </div>

        {/* Weather Window */}
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{t('dashboard.weather')}</span>
            <CloudSun size={18} color="#f59e0b" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: 'hsl(var(--foreground))' }}>
              {farmState?.weather.temperature ?? 29}°C
            </span>
            <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{t('dashboard.rainShort')} {farmState?.weather.rainfallChance ?? 42}%</span>
          </div>
          <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{farmState?.weather.condition ?? 'Cloud building'}</span>
        </div>

        {/* Economic Protection */}
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{t('risk.valueProtected')}</span>
            <TrendingUp size={18} color="#10b981" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>₹3,100</span>
            <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{t('dashboard.perAcre')}</span>
          </div>
          <span style={{ fontSize: 12, color: '#10b981', fontWeight: 700 }}>{t('dashboard.ratioBenefit')}</span>
        </div>
      </div>

      {/* Main Interactive Digital Twin Map */}
      <section className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'hsl(var(--foreground))' }}>{t('digitalTwin.title')}</h3>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>{t('digitalTwin.description')}</p>
          </div>
          <Link href="/digital-twin" className="btn btn-outline" style={{ fontSize: 12 }}>
            {t('dashboard.fullMap')} <ArrowRight size={14} />
          </Link>
        </div>

        <DigitalTwinMap
          farmName="Nandgaon Farm · Ramesh Patil"
          partitions={partitionsMapData}
          selectedPartitionId={currentFieldId}
          onSelectPartition={onSelectField}
          height={400}
          t={t}
        />
      </section>
    </div>
  );
}

// ==========================================
// Pages: 3. Educator Dashboard
// ==========================================

function EducatorDashboard() {
  const { t } = useLanguage();
  const [cases, setCases] = useState<any[]>([]);

  useEffect(() => {
    fetchEducatorCases()
      .then((data) => setCases(data.cases || []))
      .catch(() => setCases([]));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="hero-panel" style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%)', color: '#fff', borderRadius: 16, padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 20, width: 'fit-content', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
          <GraduationCap size={14} />
          <span>{t('role.educator.headline')}</span>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>{t('role.educator.demoTitle')}</h2>
        <p style={{ fontSize: 14, opacity: 0.9, marginTop: 6, maxWidth: 720 }}>
          {t('role.educator.summary')}
        </p>
      </div>

      {/* Demo Farm Digital Twin */}
      <section className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>{t('role.educator.mpkvTitle')}</h3>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>{t('role.educator.mpkvDesc')}</p>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', background: '#7c3aed20', padding: '4px 8px', borderRadius: 6 }}>
            {t('role.educator.instScope')}
          </span>
        </div>

        <DigitalTwinMap
          farmName="MPKV Rahuri Demonstration Trial Plot"
          centerCoordinates={[19.392, 74.651]}
          partitions={[
            { id: 'demo-01', name: 'IPM Demonstration Plot', crop: 'Tomato', stage: 'Fruiting', area: 2.0, riskScore: 15, riskLevel: 'Low', soilMoisture: 52 },
            { id: 'demo-02', name: 'Precision Drip Bed', crop: 'Cotton', stage: 'Boll Formation', area: 2.5, riskScore: 22, riskLevel: 'Low', soilMoisture: 45 },
          ]}
          height={340}
          t={t}
        />
      </section>

      {/* Anonymized Field Cases */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800 }}>{t('role.educator.caseTitle')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
          {cases.map((c) => (
            <div key={c.case_id} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed' }}>{c.crop} · {c.stage}</span>
                <span style={{ fontSize: 11, background: 'hsl(var(--muted))', padding: '2px 8px', borderRadius: 10 }}>{c.dataset_reference}</span>
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 700 }}>{c.title}</h4>
              <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>{c.problem}</p>
              <div style={{ background: 'hsl(var(--muted) / 0.5)', padding: 10, borderRadius: 8, fontSize: 12, color: 'hsl(var(--foreground))' }}>
                <strong>{t('role.educator.agronomicResolution')}</strong> {c.agronomic_solution}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ==========================================
// Pages: 4. Authority Dashboard
// ==========================================

function AuthorityDashboard() {
  const { t } = useLanguage();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchRegionalOverview('Maharashtra')
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="hero-panel" style={{ background: 'linear-gradient(135deg, #0c4a6e 0%, #075985 100%)', color: '#fff', borderRadius: 16, padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 20, width: 'fit-content', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
          <Shield size={14} />
          <span>{t('role.authority.headline')}</span>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>{t('role.authority.stateSurveillance')}</h2>
        <p style={{ fontSize: 14, opacity: 0.9, marginTop: 6 }}>
          {t('role.authority.stateMonitoringDesc')}
        </p>
      </div>

      {/* Regional Hotspot Map */}
      <section className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>{t('role.authority.hotspotTitle')}</h3>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>{t('role.authority.hotspotDescription')}</p>
          </div>
          <RoleBadge role="Authority" />
        </div>

        <DigitalTwinMap role="Authority" height={420} partitions={[]} t={t} />
      </section>

      {/* Crop Distribution & Advisories */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        <section className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800 }}>{t('role.authority.distribution')}</h3>
          {data?.crop_distribution?.map((c: any) => (
            <div key={c.crop} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid hsl(var(--border))' }}>
              <div>
                <strong style={{ fontSize: 14 }}>{c.crop}</strong>
                <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginLeft: 8 }}>{c.percentage}{t('role.authority.acreageSuffix')}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: c.risk_level === 'Elevated' ? '#ef444420' : '#10b98120', color: c.risk_level === 'Elevated' ? '#ef4444' : '#10b981' }}>
                {c.risk_level}
              </span>
            </div>
          ))}
        </section>

        <section className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800 }}>{t('role.authority.alertTitle')}</h3>
          {data?.active_interventions?.map((a: any) => (
            <div key={a.id} style={{ background: 'hsl(var(--muted) / 0.5)', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0284c7' }}>{a.title}</div>
              <p style={{ fontSize: 12, color: 'hsl(var(--foreground))', marginTop: 4, lineHeight: 1.5 }}>{a.advisory}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

// ==========================================
// Pages: 5. Administrator Dashboard
// ==========================================

function AdminDashboard() {
  const { t } = useLanguage();
  const [telemetry, setTelemetry] = useState<any>(null);

  useEffect(() => {
    fetchAdminSystemStatus()
      .then(setTelemetry)
      .catch(() => setTelemetry(null));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="hero-panel" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: '#fff', borderRadius: 16, padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 20, width: 'fit-content', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
          <Server size={14} />
          <span>{t('role.admin.headline')}</span>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>{t('role.admin.telemetryTitle')}</h2>
        <p style={{ fontSize: 14, opacity: 0.9, marginTop: 6 }}>
          {t('role.admin.summary')}
        </p>
      </div>

      {/* ML Models Telemetry */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <section className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800 }}>{t('role.admin.plantModel')}</h3>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: '#10b98120', padding: '2px 8px', borderRadius: 6 }}>
              {telemetry?.ml_models?.plant_village_vision?.status ?? 'ONLINE'}
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
            {t('role.admin.framework')} <strong>PyTorch MobileNetV3 (TorchScript)</strong><br />
            {t('role.admin.classes')} <strong>15 Plant Classes</strong><br />
            {t('role.admin.avgLatency')} <strong>32 ms</strong>
          </div>
        </section>

        <section className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800 }}>{t('role.admin.yieldModel')}</h3>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: '#10b98120', padding: '2px 8px', borderRadius: 6 }}>
              {telemetry?.ml_models?.crop_yield_regressor?.status ?? 'ONLINE'}
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
            {t('role.admin.framework')} <strong>Scikit-Learn 1.9 Random Forest</strong><br />
            {t('role.admin.modelAccuracy')} <strong>R² = 0.9909 (RMSE: 2.05 tonnes/ha)</strong><br />
            {t('role.admin.avgLatency')} <strong>12 ms</strong>
          </div>
        </section>
      </div>

      {/* User Scopes & Tenants */}
      <section className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800 }}>{t('role.admin.users')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div style={{ background: 'hsl(var(--muted) / 0.5)', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{t('role.admin.farmersCount')}</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>1,150</div>
          </div>
          <div style={{ background: 'hsl(var(--muted) / 0.5)', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{t('role.admin.educatorsCount')}</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>75</div>
          </div>
          <div style={{ background: 'hsl(var(--muted) / 0.5)', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{t('role.admin.authorityCount')}</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>45</div>
          </div>
          <div style={{ background: 'hsl(var(--muted) / 0.5)', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{t('role.admin.adminsCount')}</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>10</div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ==========================================
// Pages: 6. Plant Scanner Page
// ==========================================

function ScanPage({
  scan,
  setScan,
  onAddActivity,
  notify,
}: {
  scan: DiseaseScan;
  setScan: React.Dispatch<React.SetStateAction<DiseaseScan>>;
  onAddActivity: (act: FarmerActivity) => void;
  notify: (msg: string) => void;
}) {
  const { t } = useLanguage();
  const [scanning, setScanning] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRunScan = async () => {
    setScanning(true);
    try {
      const res = await requestPlantScan(fileName || 'leaf_scan.jpg', imagePreview || undefined);
      const isHealthy = res.healthy_affected_state === 'healthy';
      const newScan: DiseaseScan = {
        disease: res.disease || 'Healthy Plant',
        confidence: res.confidence || 88.0,
        severity: isHealthy ? t('scan.healthyNormal') : t('scan.activeSymptom'),
        evidence: res.evidence?.evidence_text || 'Classification completed by PyTorch MobileNetV3 model.',
        action: isHealthy ? t('scan.healthyAction') : t('scan.affectedAction'),
        scannedAt: t('common.today'),
        modelStatus: res.model_status || 'MODEL_AVAILABLE',
      };
      setScan(newScan);
      onAddActivity({
        type: t('nav.scan'),
        date: t('common.today'),
        note: `${newScan.disease} (${newScan.confidence}%).`,
      });
      notify(t('common.success'));
    } catch (err: any) {
      notify(`Scan error: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>{t('scan.title')}</h2>
        <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>{t('scan.description')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
        {/* Upload / Camera Card */}
        <section className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              height: 260,
              borderRadius: 12,
              background: 'hsl(var(--muted) / 0.5)',
              border: '2px dashed hsl(var(--border))',
              display: 'grid',
              placeItems: 'center',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Leaf Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Camera size={36} color="hsl(var(--muted-foreground))" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 14, fontWeight: 700 }}>{t('scan.choosePhoto')}</div>
                <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>{t('scan.daylightHint')}</p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <label className="btn btn-outline" style={{ flex: 1, cursor: 'pointer', textAlign: 'center' }}>
              <Upload size={16} />
              <span>{fileName || t('scan.choosePhoto')}</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} hidden />
            </label>

            <button className="btn btn-primary" onClick={handleRunScan} disabled={scanning} data-testid="button-run-scan">
              <ScanLine size={16} />
              <span>{scanning ? t('scan.reading') : t('scan.button')}</span>
            </button>
          </div>
        </section>

        {/* Inference Result Card */}
        <section className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{t('scan.latestReading')}</span>
            <span style={{ fontSize: 11, fontWeight: 700, background: '#05966920', color: '#059669', padding: '2px 8px', borderRadius: 6 }}>
              {scan.modelStatus || 'PyTorch MobileNetV3'}
            </span>
          </div>

          <h3 style={{ fontSize: 22, fontWeight: 800, color: 'hsl(var(--foreground))' }}>{scan.disease}</h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'hsl(var(--muted) / 0.5)', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>{scan.confidence}%</div>
            <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
              {t('scan.confidenceDesc')}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{t('scan.evidence')}</div>
            <p style={{ fontSize: 13, color: 'hsl(var(--foreground))', marginTop: 4, lineHeight: 1.5 }}>{scan.evidence}</p>
          </div>

          <div style={{ background: '#05966915', border: '1px solid #05966930', padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>{t('scan.action')}</div>
            <p style={{ fontSize: 13, color: 'hsl(var(--foreground))', marginTop: 4, lineHeight: 1.5 }}>{scan.action}</p>
          </div>
        </section>
      </div>
    </div>
  );
}

// ==========================================
// Pages: 7. Product & QR Scanner Page
// ==========================================

function QRPage({ currentField, notify }: { currentField?: Field; notify: (msg: string) => void }) {
  const { t } = useLanguage();
  const [productCode, setProductCode] = useState('PROD-MANCOZEB-75');
  const [result, setResult] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const activeFieldId = currentField?.id || 'field-01';
  const mapping = FARM_FIELD_PARTITIONS[activeFieldId] || { farmId: 'farm-01', partitionId: 'partition-02' };

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || productCode;
    if (!code) return;
    setChecking(true);
    try {
      const res = await requestProductSuitability(code, mapping.farmId, mapping.partitionId);
      setResult(res);
      notify(t('common.success'));
    } catch (err: any) {
      notify(`Verification error: ${err.message}`);
    } finally {
      setChecking(false);
    }
  };

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsCameraActive(true);
        notify('Camera stream started. Position QR/Barcode in frame.');
      } else {
        notify('Camera device not accessible in this browser.');
      }
    } catch (err: any) {
      notify(`Camera access notice: ${err.message}`);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>{t('qr.title')}</h2>
          <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
            {t('qr.description')} · <strong>{currentField?.name || 'North Block'}</strong> ({currentField?.crop || 'Cotton'})
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
        {/* Scanner & Manual Input Card */}
        <section className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Real Camera Viewport */}
          <div
            style={{
              height: 220,
              borderRadius: 12,
              background: '#0f172a',
              border: '2px dashed hsl(var(--border))',
              display: 'grid',
              placeItems: 'center',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {isCameraActive ? (
              <>
                <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay playsInline muted />
                <div
                  style={{
                    position: 'absolute',
                    top: '20%',
                    left: '20%',
                    right: '20%',
                    bottom: '20%',
                    border: '2px solid #10b981',
                    borderRadius: 8,
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                    pointerEvents: 'none',
                  }}
                />
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 16 }}>
                <QrCode size={36} color="hsl(var(--muted-foreground))" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13, fontWeight: 700 }}>{t('qr.startCamera')}</div>
                <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
                  Verify agricultural chemical suitability against active crop stage
                </p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {isCameraActive ? (
              <button className="btn btn-outline" style={{ width: '100%', color: '#ef4444', borderColor: '#ef4444' }} onClick={stopCamera}>
                {t('qr.stopCamera')}
              </button>
            ) : (
              <button className="btn btn-outline" style={{ width: '100%' }} onClick={startCamera}>
                <Camera size={16} />
                <span>{t('qr.startCamera')}</span>
              </button>
            )}
          </div>

          <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{t('qr.manualInput')}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                className="input"
                style={{ flex: 1 }}
                placeholder="e.g. PROD-COPPER-50"
              />
              <button className="btn btn-primary" onClick={() => handleVerify()} disabled={checking} data-testid="button-verify-product">
                {t('qr.lookup')}
              </button>
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{t('qr.sampleBarcodes')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['PROD-COPPER-50', 'PROD-NEEM-1500', 'PROD-MANCOZEB-75', 'PROD-TRICHO-BIO', 'PROD-NPK-191919'].map((c) => (
              <button
                key={c}
                type="button"
                className="btn btn-outline"
                style={{ fontSize: 11, padding: '4px 8px' }}
                onClick={() => {
                  setProductCode(c);
                  handleVerify(c);
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        {/* Verification Result Card */}
        {result && (
          <section className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{t('qr.productIntelligence')}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  background: result.suitability?.safe ? '#10b98120' : '#f59e0b20',
                  color: result.suitability?.safe ? '#10b981' : '#f59e0b',
                  padding: '2px 8px',
                  borderRadius: 6,
                }}
              >
                {result.suitability?.safe ? t('qr.safe') : t('qr.warning')}
              </span>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800 }}>{result.product?.name}</h3>
            <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', lineHeight: 1.6 }}>
              {t('qr.activeIngredient')} <strong>{result.product?.active_ingredient}</strong><br />
              {t('qr.category')} <strong>{result.product?.category}</strong><br />
              Standard Dosage: <strong>{result.product?.standard_dose || '2.0 - 2.5 g / litre'}</strong>
            </div>

            <div style={{ background: result.suitability?.safe ? '#10b98115' : '#f59e0b15', border: `1px solid ${result.suitability?.safe ? '#10b98130' : '#f59e0b30'}`, padding: 12, borderRadius: 8, fontSize: 13, lineHeight: 1.5 }}>
              <strong style={{ color: result.suitability?.safe ? '#059669' : '#d97706' }}>{t('qr.partitionRec')}</strong> {result.suitability?.reason}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ==========================================
// Pages: 8. Crop Yield ML Predictor Page
// ==========================================

function YieldPredictorPage({ notify }: { notify: (msg: string) => void }) {
  const { t } = useLanguage();
  const [crop, setCrop] = useState('Cotton');
  const [area, setArea] = useState(2.4);
  const [fertilizer, setFertilizer] = useState(110);
  const [pesticide, setPesticide] = useState(1.8);
  const [season, setSeason] = useState('Kharif');
  const [state, setState] = useState('Maharashtra');
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const res = await requestYieldPrediction({
        crop,
        year: 2024,
        season,
        state,
        area,
        fertilizer,
        pesticide,
      });
      setPrediction(res);
      notify(t('common.success'));
    } catch (err: any) {
      notify(`Prediction error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handlePredict();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>{t('yield.title')}</h2>
          <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>{t('yield.description')}</p>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', background: '#05966920', padding: '4px 10px', borderRadius: 8 }}>
          {t('yield.modelBadge')}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
        {/* Simulation Controls */}
        <section className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{t('fields.crop')}</label>
              <select value={crop} onChange={(e) => setCrop(e.target.value)} className="input" style={{ width: '100%', marginTop: 4 }}>
                {['Cotton', 'Tomato', 'Potato', 'Chickpea', 'Onion', 'Rice', 'Wheat', 'Sugarcane', 'Soybean'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{t('yield.state')}</label>
              <select value={state} onChange={(e) => setState(e.target.value)} className="input" style={{ width: '100%', marginTop: 4 }}>
                {['Maharashtra', 'Andhra Pradesh', 'Karnataka', 'Gujarat', 'Punjab', 'Uttar Pradesh', 'Tamil Nadu', 'Madhya Pradesh'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
              <span>{t('yield.area')}</span>
              <span>{area} ha</span>
            </div>
            <input type="range" min="0.5" max="20" step="0.1" value={area} onChange={(e) => setArea(Number(e.target.value))} style={{ width: '100%', marginTop: 6 }} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
              <span>{t('yield.fertilizer')}</span>
              <span>{fertilizer} kg/ha</span>
            </div>
            <input type="range" min="40" max="250" step="5" value={fertilizer} onChange={(e) => setFertilizer(Number(e.target.value))} style={{ width: '100%', marginTop: 6 }} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
              <span>{t('yield.pesticide')}</span>
              <span>{pesticide} kg/ha</span>
            </div>
            <input type="range" min="0.2" max="4.5" step="0.1" value={pesticide} onChange={(e) => setPesticide(Number(e.target.value))} style={{ width: '100%', marginTop: 6 }} />
          </div>

          <button className="btn btn-primary" onClick={handlePredict} disabled={loading} style={{ marginTop: 8 }} data-testid="button-predict-yield">
            {loading ? t('yield.runningRF') : t('yield.calculate')}
          </button>
        </section>

        {/* Prediction Results */}
        {prediction && (
          <section className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{t('yield.predicted')}</span>
              <span style={{ fontSize: 11, fontWeight: 700, background: '#10b98120', color: '#10b981', padding: '2px 8px', borderRadius: 6 }}>
                {t('scan.confidence')}: {prediction.confidence}%
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 42, fontWeight: 900, color: '#059669' }}>{prediction.predicted_yield}</span>
              <span style={{ fontSize: 16, color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>{t('yield.tonnesPerHa')}</span>
            </div>

            <div style={{ background: 'hsl(var(--muted) / 0.5)', padding: 14, borderRadius: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{t('yield.totalProduction')}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'hsl(var(--foreground))', marginTop: 4 }}>
                {(prediction.predicted_yield * area).toFixed(1)} {t('yield.tonnes')}
              </div>
            </div>

            <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, borderTop: '1px solid hsl(var(--border))', paddingTop: 12 }}>
              {t('yield.sourceLabel')} {prediction.source}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ==========================================
// Pages: 9. Rakshak Assistant (Powered by Gemini 2.5 Flash)
// ==========================================

function AssistantPage({
  farmState,
  fields,
  currentFieldId,
}: {
  farmState: FarmStateSnapshot | null;
  fields: Field[];
  currentFieldId: string;
}) {
  const { language, setLanguage } = useLanguage();
  return (
    <RakshakAssistant
      farmState={farmState}
      fields={fields}
      currentFieldId={currentFieldId}
      appLanguage={language}
      onLanguageChange={setLanguage}
    />
  );
}

// ==========================================
// Pages: 10. Fields & Digital Twin Dedicated Pages
// ==========================================

function DigitalTwinPage({
  fields,
  currentFieldId,
  onSelectField,
}: {
  fields: Field[];
  currentFieldId: string;
  onSelectField: (id: string) => void;
}) {
  const { t } = useLanguage();
  const { session } = useAuth();

  const partitionsMapData: PartitionMapData[] = fields.map((f) => ({
    id: f.id,
    name: f.name,
    crop: f.crop,
    stage: f.stage,
    area: f.area,
    riskScore: f.riskScore,
    riskLevel: f.riskLevel,
    soilMoisture: f.soilMoisture,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>{t('digitalTwin.title')}</h2>
        <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>{t('digitalTwin.description')}</p>
      </div>

      <DigitalTwinMap
        farmName={t('digitalTwin.estateName')}
        partitions={partitionsMapData}
        selectedPartitionId={currentFieldId}
        onSelectPartition={onSelectField}
        role={session?.role || 'Farmer'}
        height={560}
        t={t}
      />
    </div>
  );
}

function FieldsPage({
  fields,
  currentFieldId,
  onSelectField,
}: {
  fields: Field[];
  currentFieldId: string;
  onSelectField: (id: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>{t('fields.title')}</h2>
          <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>{t('fields.description')}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {fields.map((f) => {
          const isSelected = f.id === currentFieldId;
          return (
            <div
              key={f.id}
              className="card card-pad"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                border: isSelected ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 16 }}>{f.name}</strong>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: f.riskLevel === 'High' ? '#ef444420' : f.riskLevel === 'Medium' ? '#f59e0b20' : '#10b98120',
                    color: f.riskLevel === 'High' ? '#ef4444' : f.riskLevel === 'Medium' ? '#f59e0b' : '#10b981',
                  }}
                >
                  {f.riskLevel} {t('fields.riskSuffix')}
                </span>
              </div>

              <div style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
                🌾 {t('fields.crop')}: <strong>{f.crop}</strong> ({f.stage})<br />
                📐 {t('fields.area')}: <strong>{f.area} {t('common.acres')}</strong><br />
                💧 {t('fields.moisture')}: <strong>{f.soilMoisture}%</strong> ({f.waterStatus})
              </div>

              <button
                type="button"
                className={`btn ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => onSelectField(f.id)}
                style={{ width: '100%', marginTop: 'auto' }}
              >
                {isSelected ? t('fields.currentActive') : t('fields.switchActive')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// Pages: 11. Explainable Risk & Value Page
// ==========================================

function RiskAndValuePage({
  currentField,
  farmState,
}: {
  currentField: Field;
  farmState: FarmStateSnapshot | null;
}) {
  const { t } = useLanguage();
  const [riskData, setRiskData] = useState<any>(null);

  const mapping = FARM_FIELD_PARTITIONS[currentField.id] || { farmId: 'farm-01', partitionId: 'partition-02' };

  useEffect(() => {
    requestRisk(mapping.farmId, mapping.partitionId)
      .then(setRiskData)
      .catch(() => setRiskData(null));
  }, [currentField.id]);

  const score = riskData?.overallRisk ?? farmState?.riskScore ?? currentField.riskScore;
  const level = riskData?.riskLevel ?? farmState?.riskLevel ?? currentField.riskLevel;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>{t('risk.title')}</h2>
          <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
            {t('risk.description')} · <strong>{currentField.name}</strong> ({currentField.crop})
          </p>
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            background: score > 60 ? '#ef444420' : score > 35 ? '#f59e0b20' : '#10b98120',
            color: score > 60 ? '#ef4444' : score > 35 ? '#f59e0b' : '#10b981',
            padding: '4px 12px',
            borderRadius: 8,
          }}
        >
          {level} {t('fields.riskSuffix')} ({score}/100)
        </span>
      </div>

      {/* Projection Comparison: Current State vs Act Early vs Wait 3 Days */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Current State */}
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid hsl(var(--border))' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{t('risk.now')}</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: score > 60 ? '#ef4444' : '#f59e0b' }}>{score}</span>
            <span style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))' }}>/ 100</span>
          </div>
          <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
            Moisture at {farmState?.sensor.soilMoisture ?? currentField.soilMoisture}% with rain probability {farmState?.weather.rainfallChance ?? 42}%.
          </p>
        </div>

        {/* Act Early */}
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12, border: '2px solid #10b981', background: '#10b98108' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>{t('risk.earlyAction')}</span>
            <span style={{ fontSize: 11, fontWeight: 700, background: '#10b98120', color: '#10b981', padding: '2px 8px', borderRadius: 6 }}>
              Target
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: '#10b981' }}>18</span>
            <span style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))' }}>/ 100 (Low Risk)</span>
          </div>
          <p style={{ fontSize: 13, color: 'hsl(var(--foreground))' }}>
            Hold spray 24h, check drainage channels, scout lower canopy. Protects yield before rainfall window.
          </p>
        </div>

        {/* Wait 3 Days */}
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12, border: '2px solid #ef4444', background: '#ef444408' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>{t('risk.delay3Days')}</span>
            <span style={{ fontSize: 11, fontWeight: 700, background: '#ef444420', color: '#ef4444', padding: '2px 8px', borderRadius: 6 }}>
              Danger
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: '#ef4444' }}>84</span>
            <span style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))' }}>/ 100 (Severe)</span>
          </div>
          <p style={{ fontSize: 13, color: 'hsl(var(--foreground))' }}>
            Foliar lesions spread to middle/upper canopy; nutrient loss and root saturation can cause severe yield drop.
          </p>
        </div>
      </div>

      {/* Economic Decision Impact Card */}
      <section className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800 }}>{t('dashboard.economicImpact')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div style={{ background: 'hsl(var(--muted) / 0.5)', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{t('risk.costToday')}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b', marginTop: 4 }}>₹220 {t('dashboard.perAcre')}</div>
          </div>
          <div style={{ background: 'hsl(var(--muted) / 0.5)', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{t('risk.valueProtected')}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#10b981', marginTop: 4 }}>₹1,600 {t('dashboard.perAcre')}</div>
          </div>
          <div style={{ background: 'hsl(var(--muted) / 0.5)', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{t('risk.lossIfDelayed')}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#ef4444', marginTop: 4 }}>₹3,100 {t('dashboard.perAcre')}</div>
          </div>
          <div style={{ background: 'hsl(var(--muted) / 0.5)', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{t('risk.benefitCostRatio')}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#059669', marginTop: 4 }}>14.1×</div>
          </div>
        </div>
      </section>

      {/* Why This Score Breakdown */}
      <section className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800 }}>{t('risk.whyThisScore')}</h3>
        <ul style={{ fontSize: 13, color: 'hsl(var(--foreground))', lineHeight: 1.8, paddingLeft: 18 }}>
          <li>
            🌧️ <strong>Rainfall Window ({farmState?.weather.rainfallChance ?? 42}% chance):</strong> Chemical spraying within 24h risks chemical wash-off and financial loss.
          </li>
          <li>
            💧 <strong>Soil Moisture ({farmState?.sensor.soilMoisture ?? currentField.soilMoisture}%):</strong> Below target (38-45%), requiring controlled drainage monitoring before supplementary irrigation.
          </li>
          <li>
            🔬 <strong>Vision Classifier Risk:</strong> Early bacterial leaf spot symptoms identified on lower foliage.
          </li>
        </ul>
      </section>
    </div>
  );
}

// ==========================================
// Pages: 12. Recommendations / Action Plan
// ==========================================

function RecommendationsPage({
  currentField,
  onAddActivity,
  notify,
}: {
  currentField: Field;
  onAddActivity?: (act: FarmerActivity) => void;
  notify?: (msg: string) => void;
}) {
  const { t } = useLanguage();
  const [rec, setRec] = useState<any>(null);
  const [status, setStatus] = useState<'pending' | 'planned' | 'done'>('pending');

  const mapping = FARM_FIELD_PARTITIONS[currentField.id] || { farmId: 'farm-01', partitionId: 'partition-02' };

  useEffect(() => {
    requestRecommendation(mapping.farmId, mapping.partitionId)
      .then(setRec)
      .catch(() => setRec(null));
  }, [currentField.id]);

  const handleMarkPlanned = () => {
    setStatus('planned');
    if (onAddActivity) {
      onAddActivity({
        type: 'Action Planned',
        date: t('common.today'),
        note: `Planned: ${rec?.action || t('dashboard.heroTitle')} for ${currentField.name}.`,
      });
    }
    if (notify) notify('Action marked as Planned in Farm Timeline.');
  };

  const handleMarkDone = () => {
    setStatus('done');
    if (onAddActivity) {
      onAddActivity({
        type: 'Action Completed',
        date: t('common.today'),
        note: `Completed: ${rec?.action || t('dashboard.heroTitle')} on ${currentField.name}.`,
      });
    }
    if (notify) notify('Action completed and saved to Farm Memory.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>{t('recommendations.title')}</h2>
          <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
            {t('recommendations.description')} · <strong>{currentField.name}</strong> ({currentField.crop})
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn ${status === 'planned' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: 12 }}
            onClick={handleMarkPlanned}
          >
            {t('recommendations.markPlanned')}
          </button>
          <button
            className={`btn ${status === 'done' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: 12, background: status === 'done' ? '#10b981' : undefined, color: status === 'done' ? '#fff' : undefined }}
            onClick={handleMarkDone}
          >
            <Check size={14} />
            <span>{t('recommendations.markDone')}</span>
          </button>
        </div>
      </div>

      <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>
            {rec?.timing || t('recommendations.priority24h')}
          </div>
          <span style={{ fontSize: 11, background: '#10b98120', color: '#10b981', fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>
            {t('scan.confidence')}: {rec?.confidence ?? 79}%
          </span>
        </div>

        <h3 style={{ fontSize: 20, fontWeight: 800 }}>{rec?.title || t('dashboard.heroTitle')}</h3>

        <div style={{ fontSize: 13, lineHeight: 1.6, color: 'hsl(var(--foreground))' }}>
          <strong>{t('recommendations.whyLabel')}</strong> {rec?.reason || t('dashboard.heroDesc')}
        </div>

        <div style={{ fontSize: 13, lineHeight: 1.6, color: 'hsl(var(--foreground))' }}>
          <strong>{t('recommendations.actionLabel')}</strong> {rec?.action || 'Hold off on spraying; inspect drainage channels and check soil moisture after rain clears.'}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, background: 'hsl(var(--muted) / 0.5)', padding: 14, borderRadius: 10 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{t('recommendations.costLabel')}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#f59e0b' }}>{rec?.cost || '₹220'} {t('dashboard.perAcre')}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{t('recommendations.benefitLabel')}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981' }}>{rec?.benefit || '₹1,600'} {t('dashboard.perAcre')}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{t('recommendations.potentialLossLabel')}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#ef4444' }}>{rec?.potentialLoss || '₹3,100'} {t('dashboard.perAcre')}</div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
          {t('recommendations.sourceLabel')} {rec?.source || 'ICAR Agricultural Advisories & Local Agro-Forecast'}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Pages: 13. Weather, Timeline & Settings
// ==========================================

function WeatherPage({ farmState, currentField }: { farmState: FarmStateSnapshot | null; currentField: Field }) {
  const { t } = useLanguage();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>{t('weather.title')}</h2>
        <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
          {currentField.name} ({currentField.location}) · <strong>{currentField.crop}</strong>
        </p>
      </div>

      {/* Atmospheric Weather Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div className="card card-pad">
          <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{t('weather.temperature')}</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 4 }}>{farmState?.weather.temperature ?? 29}°C</div>
          <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>{farmState?.weather.condition ?? 'Cloud cover building'}</div>
        </div>
        <div className="card card-pad">
          <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{t('weather.humidity')}</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 4 }}>{farmState?.weather.humidity ?? 68}%</div>
          <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 2 }}>Elevated foliar spore risk</div>
        </div>
        <div className="card card-pad">
          <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{t('weather.rainChance')}</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 4, color: '#0284c7' }}>{farmState?.weather.rainfallChance ?? 42}%</div>
          <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>Next 18-24 hour window</div>
        </div>
        <div className="card card-pad">
          <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{t('weather.soilMoisture')}</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 4, color: '#059669' }}>{farmState?.sensor.soilMoisture ?? 31}%</div>
          <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 2 }}>Probe #01 (Target: 38-45%)</div>
        </div>
      </div>

      {/* Soil Chemistry Profile */}
      <section className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800 }}>{t('dashboard.soil')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ background: 'hsl(var(--muted) / 0.5)', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{t('weather.soilPh')}</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{farmState?.sensor.ph ?? 6.7}</div>
            <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600, marginTop: 2 }}>Optimal root absorption</div>
          </div>
          <div style={{ background: 'hsl(var(--muted) / 0.5)', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{t('weather.nitrogen')}</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{farmState?.sensor.nitrogen ?? '49 kg/ha'}</div>
            <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>Medium level</div>
          </div>
          <div style={{ background: 'hsl(var(--muted) / 0.5)', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{t('weather.phosphorus')}</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{farmState?.sensor.phosphorus ?? 37} kg/ha</div>
            <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600, marginTop: 2 }}>Healthy vegetative support</div>
          </div>
          <div style={{ background: 'hsl(var(--muted) / 0.5)', padding: 14, borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{t('weather.potassium')}</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{farmState?.sensor.potassium ?? 51} kg/ha</div>
            <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600, marginTop: 2 }}>Good disease tolerance</div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ActivitiesPage({ activities }: { activities: FarmerActivity[] }) {
  const { t } = useLanguage();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>{t('activities.title')}</h2>
        <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>{t('activities.description')}</p>
      </div>

      <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {activities.map((a, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 14, paddingBottom: 12, borderBottom: idx < activities.length - 1 ? '1px solid hsl(var(--border))' : 0 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', marginTop: 5 }} />
            <div>
              <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{a.date}</div>
              <strong style={{ fontSize: 14, color: 'hsl(var(--foreground))' }}>{a.type}</strong>
              <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>{a.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationsPage({
  notifications,
  onMarkRead,
}: {
  notifications: FarmNotification[];
  onMarkRead: (id: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>{t('notifications.title')}</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {notifications.map((n) => (
          <div
            key={n.id}
            className="card card-pad"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderLeft: n.severity === 'high' ? '4px solid #ef4444' : n.severity === 'medium' ? '4px solid #f59e0b' : '4px solid #10b981',
              opacity: n.read ? 0.7 : 1,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong style={{ fontSize: 15 }}>{n.title}</strong>
                <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{n.timestamp}</span>
              </div>
              <p style={{ fontSize: 13, color: 'hsl(var(--foreground))', marginTop: 4 }}>{n.why}</p>
              <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginTop: 4 }}>{t('notifications.actionPrefix')} {n.action}</div>
            </div>

            {!n.read && (
              <button className="btn btn-outline" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => onMarkRead(n.id)}>
                {t('notifications.markRead')}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPage() {
  const { t } = useLanguage();
  const { session } = useAuth();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>{t('settings.title')}</h2>
      </div>

      <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{t('settings.profile')}</label>
          <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4 }}>{session?.name}</div>
          <div style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>{session?.village}</div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>{t('settings.language')}</label>
          <div style={{ marginTop: 8 }}>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Main Application Router
// ==========================================

export function AppRouter() {
  const { session, authenticated } = useAuth();
  const [fields] = useState<Field[]>(DEFAULT_FIELDS);
  const [currentFieldId, setCurrentFieldId] = useState('field-01');
  const [farmState, setFarmState] = useState<FarmStateSnapshot | null>(null);
  const [scan, setScan] = useState<DiseaseScan>(DEFAULT_SCAN);
  const [activities, setActivities] = useState<FarmerActivity[]>(DEFAULT_ACTIVITIES);
  const [notifications, setNotifications] = useState<FarmNotification[]>(DEFAULT_NOTIFICATIONS);
  const [toastMsg, setToastMsg] = useState('');

  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const addActivity = (act: FarmerActivity) => {
    setActivities([act, ...activities]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  useEffect(() => {
    fetchFarmState(currentFieldId).then(setFarmState);
  }, [currentFieldId]);

  if (!authenticated) {
    return <LoginPage />;
  }

  const role = session?.role || 'Farmer';
  const unreadCount = notifications.filter((n) => !n.read).length;
  const currentField = fields.find((f) => f.id === currentFieldId) || fields[0];

  return (
    <AppShell
      fields={fields}
      currentFieldId={currentFieldId}
      onSelectField={(id) => setCurrentFieldId(id)}
      unreadCount={unreadCount}
    >
      <Switch>
        <Route path="/dashboard">
          {role === 'Educator' ? (
            <EducatorDashboard />
          ) : role === 'Authority' ? (
            <AuthorityDashboard />
          ) : role === 'Administrator' ? (
            <AdminDashboard />
          ) : (
            <FarmerDashboard
              fields={fields}
              currentFieldId={currentFieldId}
              onSelectField={(id) => setCurrentFieldId(id)}
              farmState={farmState}
            />
          )}
        </Route>

        <Route path="/digital-twin">
          <DigitalTwinPage
            fields={fields}
            currentFieldId={currentFieldId}
            onSelectField={(id) => setCurrentFieldId(id)}
          />
        </Route>

        <Route path="/fields">
          <FieldsPage
            fields={fields}
            currentFieldId={currentFieldId}
            onSelectField={(id) => setCurrentFieldId(id)}
          />
        </Route>

        <Route path="/scan">
          <ScanCrop
            onAddActivity={addActivity}
            notify={notify}
          />
        </Route>

        <Route path="/qr">
          <QRPage currentField={currentField} notify={notify} />
        </Route>

        <Route path="/risk">
          <RiskAndValuePage currentField={currentField} farmState={farmState} />
        </Route>

        <Route path="/yield">
          <YieldPredictorPage notify={notify} />
        </Route>

        <Route path="/recommendations">
          <RecommendationsPage currentField={currentField} onAddActivity={addActivity} notify={notify} />
        </Route>

        <Route path="/weather">
          <WeatherPage farmState={farmState} currentField={currentField} />
        </Route>

        <Route path="/activities">
          <ActivitiesPage activities={activities} />
        </Route>

        <Route path="/assistant">
          <AssistantPage farmState={farmState} fields={fields} currentFieldId={currentFieldId} />
        </Route>

        <Route path="/notifications">
          <NotificationsPage notifications={notifications} onMarkRead={markNotificationRead} />
        </Route>

        <Route path="/settings">
          <SettingsPage />
        </Route>

        <Route>
          {role === 'Educator' ? (
            <EducatorDashboard />
          ) : role === 'Authority' ? (
            <AuthorityDashboard />
          ) : role === 'Administrator' ? (
            <AdminDashboard />
          ) : (
            <FarmerDashboard
              fields={fields}
              currentFieldId={currentFieldId}
              onSelectField={(id) => setCurrentFieldId(id)}
              farmState={farmState}
            />
          )}
        </Route>
      </Switch>

      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            zIndex: 9999,
          }}
        >
          {toastMsg}
        </div>
      )}

      <FloatingAskRakshak />
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppRouter />
      </LanguageProvider>
    </AuthProvider>
  );
}
