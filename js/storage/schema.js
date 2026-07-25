/**
 * LM Nutrition — Schema de la base de datos
 * Define todos los stores de IndexedDB y sus índices.
 * Para agregar un store: incrementar DB_VERSION y añadir bloque en db.js.
 */

export const DB_NAME    = 'lm-nutrition-db';
export const DB_VERSION = 1;

export const STORES = [
  {
    name: 'profile',
    keyPath: 'id',
    autoIncrement: false,
    indexes: []
  },
  {
    name: 'foods',
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
      { name: 'by-name',     keyPath: 'name',     unique: false },
      { name: 'by-category', keyPath: 'category', unique: false }
    ]
  },
  {
    name: 'meals',
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
      { name: 'by-date', keyPath: 'date', unique: false },
      { name: 'by-type', keyPath: 'type', unique: false }
    ]
  },
  {
    name: 'mealItems',
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
      { name: 'by-mealId', keyPath: 'mealId', unique: false },
      { name: 'by-date',   keyPath: 'date',   unique: false }
    ]
  },
  {
    name: 'weight',
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
      { name: 'by-date', keyPath: 'date', unique: true }
    ]
  },
  {
    name: 'waterLog',
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
      { name: 'by-date', keyPath: 'date', unique: false }
    ]
  }
];

/** Factories de datos por defecto */
export const defaults = {
  profile: () => ({
    id: 'main',
    userId:        null,
    name:          '',
    sex:           null,
    birthDate:     null,
    heightCm:      null,
    weightKg:      null,
    activityLevel: null,
    goal:          null,
    targets: {
      calories: 2000,
      proteinG: 150,
      carbsG:   200,
      fatG:     67,
      waterMl:  2000
    },
    syncStatus: 'local',
    createdAt:  new Date().toISOString(),
    updatedAt:  new Date().toISOString()
  }),

  food: (overrides = {}) => ({
    id:        undefined,
    userId:    null,
    name:      '',
    brand:     null,
    category:  'general',
    barcode:   null,
    per100g: {
      calories: 0, proteinG: 0, carbsG: 0, fatG: 0,
      fiberG: null, sugarG: null, sodiumMg: null
    },
    isCustom:   true,
    syncStatus: 'local',
    createdAt:  new Date().toISOString(),
    ...overrides
  }),

  meal: (overrides = {}) => ({
    id:         undefined,
    userId:     null,
    date:       null,
    type:       'other',
    syncStatus: 'local',
    createdAt:  new Date().toISOString(),
    ...overrides
  }),

  mealItem: (overrides = {}) => ({
    id:         undefined,
    userId:     null,
    mealId:     null,
    foodId:     null,
    date:       null,
    quantityG:  100,
    syncStatus: 'local',
    createdAt:  new Date().toISOString(),
    ...overrides
  })
};
