/**
 * LM Nutrition — FoodService
 * CRUD de la base de datos de alimentos.
 */

import { db }              from '../storage/db.js';
import { defaults }        from '../storage/schema.js';
import { eventBus, EVENTS } from '../utils/eventBus.js';

class FoodService {
  async search(query, limit = 25) {
    if (!query || query.trim().length < 2) return [];
    const all = await db.getAll('foods');
    const q   = query.toLowerCase().trim();
    return all.filter(f => f.name.toLowerCase().includes(q)).slice(0, limit);
  }

  async getById(id)       { return db.get('foods', id); }
  async getAll(cat = null) {
    if (!cat) return db.getAll('foods');
    return db.getByIndex('foods', 'by-category', cat);
  }

  async create(data) {
    const food = defaults.food({ ...data, isCustom: true });
    const id   = await db.add('foods', food);
    await db.sync('foods', id);
    eventBus.emit(EVENTS.FOOD_CREATED, { id, name: food.name });
    return { ...food, id };
  }

  async update(id, changes) {
    const e = await db.get('foods', id);
    if (!e) throw new Error(`Alimento ${id} no encontrado`);
    const u = { ...e, ...changes, id };
    await db.put('foods', u);
    eventBus.emit(EVENTS.FOOD_UPDATED, { id });
    return u;
  }

  async delete(id) {
    await db.delete('foods', id);
    eventBus.emit(EVENTS.FOOD_DELETED, { id });
  }

  async seedIfEmpty() {
    const n = await db.count('foods');
    if (n > 0) return;
    await db.putMany('foods', BASE_FOODS());
  }
}

export const foodService = new FoodService();

function BASE_FOODS() {
  const now = new Date().toISOString();
  const mk = (id, name, cat, cal, prot, carb, fat) => ({
    id, name, category: cat, isCustom: false, barcode: null, brand: null, userId: null, syncStatus: 'local', createdAt: now,
    per100g: { calories: cal, proteinG: prot, carbsG: carb, fatG: fat, fiberG: null, sugarG: null, sodiumMg: null }
  });
  return [
    mk(1,  'Pechuga de pollo',    'proteinas',     165, 31,  0,    3.6),
    mk(2,  'Carne molida magra',  'proteinas',     215, 26,  0,   12  ),
    mk(3,  'Clara de huevo',      'proteinas',      52, 11,  0.7,  0.2),
    mk(4,  'Huevo entero',        'proteinas',     155, 13,  1.1, 11  ),
    mk(5,  'Atún en agua',        'proteinas',     116, 26,  0,    1  ),
    mk(6,  'Lomo de cerdo',       'proteinas',     143, 26,  0,    4  ),
    mk(7,  'Yogur griego 0%',     'proteinas',      59, 10,  3.6,  0.4),
    mk(8,  'Salmón',              'proteinas',     208, 20,  0,   13  ),
    mk(9,  'Queso cottage',       'proteinas',      98, 11,  3.4,  4.3),
    mk(10, 'Pavo pechuga',        'proteinas',     135, 30,  0,    1  ),
    mk(20, 'Arroz blanco cocido', 'carbohidratos', 130,  2.7,28,   0.3),
    mk(21, 'Arroz integral cocido','carbohidratos',111,  2.6,23,   0.9),
    mk(22, 'Avena',               'carbohidratos', 389, 17, 66,    7  ),
    mk(23, 'Papa cocida',         'carbohidratos',  86,  1.9,20,   0.1),
    mk(24, 'Batata cocida',       'carbohidratos',  90,  2, 21,    0.1),
    mk(25, 'Pan integral',        'carbohidratos', 247, 13, 41,    3.4),
    mk(26, 'Pasta cocida',        'carbohidratos', 131,  5, 25,    1.1),
    mk(27, 'Banana',              'frutas',          89,  1.1,23,  0.3),
    mk(28, 'Manzana',             'frutas',          52,  0.3,14,  0.2),
    mk(29, 'Naranja',             'frutas',          47,  0.9,12,  0.1),
    mk(40, 'Aceite de oliva',     'grasas',         884,  0,  0, 100  ),
    mk(41, 'Palta',               'grasas',         160,  2,  9,  15  ),
    mk(42, 'Maní',                'grasas',         567, 26, 16,  49  ),
    mk(43, 'Manteca de maní',     'grasas',         588, 25, 20,  50  ),
    mk(44, 'Almendras',           'grasas',         579, 21, 22,  50  ),
    mk(50, 'Espinaca cruda',      'verduras',        23,  2.9, 3.6, 0.4),
    mk(51, 'Brócoli cocido',      'verduras',        35,  2.4, 7,   0.4),
    mk(52, 'Tomate',              'verduras',        18,  0.9, 3.9, 0.2),
    mk(53, 'Lechuga',             'verduras',        15,  1.4, 2.9, 0.2),
    mk(54, 'Zanahoria',           'verduras',        41,  0.9,10,   0.2),
    mk(55, 'Pepino',              'verduras',        15,  0.7, 3.6, 0.1),
    mk(60, 'Leche descremada',    'lacteos',         35,  3.4, 5,   0.1),
    mk(61, 'Leche entera',        'lacteos',         61,  3.2, 4.8, 3.3),
    mk(62, 'Queso fresco',        'lacteos',        293, 17, 2.4, 24  ),
  ];
}
