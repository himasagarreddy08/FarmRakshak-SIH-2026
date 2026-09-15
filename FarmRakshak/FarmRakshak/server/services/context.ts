export interface FieldContextMemory {
  fieldName?: string;
  crop?: string;
  cropStage?: string;
  soilMoisture?: number | string;
  ph?: number;
  nitrogen?: number | string;
  phosphorus?: number | string;
  potassium?: number | string;
  weather?: {
    temperature?: number;
    humidity?: number;
    rainfallChance?: number;
    windSpeed?: number;
    uvIndex?: number;
    condition?: string;
  };
  temperature?: number;
  humidity?: number;
  rainfallChance?: number;
  windSpeed?: number;
  uvIndex?: number;
  diseaseScan?: {
    diseaseName?: string;
    confidence?: number;
    severity?: string;
    symptoms?: string;
  };
  lastRecommendations?: string[];
  recentMessages?: Array<{ role: string; content: string; timestamp?: string }>;
  farmId?: string;
  partitionId?: string;
  updatedAt?: string;
}

class ContextService {
  private memoryStore = new Map<string, FieldContextMemory>();

  constructor() {
    // Seed with realistic default farm context
    this.memoryStore.set('default-farm', {
      fieldName: 'North Block - Plot 2',
      crop: 'Cotton',
      cropStage: 'Flowering & Boll formation',
      soilMoisture: 31,
      ph: 6.7,
      nitrogen: '49 kg/ha',
      phosphorus: 37,
      potassium: 51,
      weather: {
        temperature: 30,
        humidity: 68,
        rainfallChance: 40,
        windSpeed: 14,
        uvIndex: 7,
        condition: 'Partly Cloudy',
      },
      temperature: 30,
      humidity: 68,
      rainfallChance: 40,
      windSpeed: 14,
      uvIndex: 7,
      diseaseScan: {
        diseaseName: 'Early Leaf Spot (Alternaria)',
        confidence: 84,
        severity: 'Moderate',
        symptoms: 'Brown concentric foliar spots with chlorotic haloes',
      },
      lastRecommendations: [
        'Apply measured irrigation during evening hours',
        'Scout border rows for early sucking pest thresholds',
      ],
      updatedAt: new Date().toISOString(),
    });
  }

  public getContext(farmKey: string = 'default-farm'): FieldContextMemory {
    return this.memoryStore.get(farmKey) || this.memoryStore.get('default-farm') || {};
  }

  public saveContext(farmKey: string = 'default-farm', data: Partial<FieldContextMemory>): FieldContextMemory {
    const existing = this.getContext(farmKey);
    const updated: FieldContextMemory = {
      ...existing,
      ...data,
      weather: {
        ...existing.weather,
        ...(data.weather || {}),
      },
      updatedAt: new Date().toISOString(),
    };

    this.memoryStore.set(farmKey, updated);
    return updated;
  }

  public appendMessage(farmKey: string = 'default-farm', role: string, content: string) {
    const ctx = this.getContext(farmKey);
    const recent = ctx.recentMessages || [];
    recent.push({ role, content, timestamp: new Date().toISOString() });
    ctx.recentMessages = recent.slice(-10); // Keep last 10 messages
    this.memoryStore.set(farmKey, ctx);
  }
}

export const contextService = new ContextService();
export default contextService;
