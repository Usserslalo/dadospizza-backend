module.exports = `
-- SECCIÓN 1: Roles de Usuario
INSERT INTO roles(name, route, created_at, updated_at) VALUES
('CLIENTE', '/client/products/list', NOW(), NOW()),
('REPARTIDOR', '/delivery/orders/list', NOW(), NOW()),
('RESTAURANTE', '/restaurant/orders/list', NOW(), NOW());

-- SECCIÓN 2: Sucursales
INSERT INTO branches(name, address, lat, lng, phone, created_at, updated_at) VALUES
('Dados Pizza - Matriz Ixmiquilpan', 'Av. Insurgentes Ote. 75, Centro, 42300 Ixmiquilpan, Hgo.', 20.484123, -99.216345, '7711234567', NOW(), NOW()),
('Dados Pizza - El Fitzhi', 'Carretera México-Laredo Km. 159, 42320 El Fitzhi, Hgo.', 20.467890, -99.234567, '7712345678', NOW(), NOW()),
('Dados Pizza - Progreso de Obregón', 'Carretera Progreso-Ixmiquilpan, 42730 Progreso de Obregón, Hgo.', 20.356789, -99.198765, '7713456789', NOW(), NOW());

-- SECCIÓN 3: Catálogos de Productos
-- Tamaños
INSERT INTO sizes(name, created_at, updated_at) VALUES
('Personal', NOW(), NOW()),
('Mediana', NOW(), NOW()),
('Grande', NOW(), NOW()),
('Familiar', NOW(), NOW()),
('Cuadrada', NOW(), NOW());

-- Categorías
INSERT INTO categories(name, description, created_at, updated_at) VALUES
('Premium', 'Nuestras pizzas más completas y con más ingredientes.', NOW(), NOW()),
('Tradicional', 'Los sabores clásicos que nunca fallan.', NOW(), NOW()),
('Especialidad', 'Combinaciones únicas de la casa.', NOW(), NOW()),
('Megamix', 'La pizza ideal para compartir con todos.', NOW(), NOW()),
('Bebidas', 'Para acompañar tu pizza.', NOW(), NOW());

-- Productos (Pizzas y Bebidas)
-- El 'price' se deja en NULL para las pizzas, ya que su precio depende del tamaño.
-- Premium
INSERT INTO products(name, description, id_category, created_at, updated_at) VALUES
('Mexicana', 'Jamon, salami, tocino, chorizo, champiñones, pimiento morron, cebolla y jalapeño', (SELECT id FROM categories WHERE name = 'Premium'), NOW(), NOW()),
('Maxipizza', 'Jamon, salami, tocino, chorizo, salchicha y peperoni', (SELECT id FROM categories WHERE name = 'Premium'), NOW(), NOW()),
('Costeñita', 'Atun, cebolla, aceitunas, jalapeños y pimiento morron', (SELECT id FROM categories WHERE name = 'Premium'), NOW(), NOW()),
('Special', 'Jamon, tocino, chorizo, cebolla y pimiento morron', (SELECT id FROM categories WHERE name = 'Premium'), NOW(), NOW()),
('Cubana', 'Jamon, tocino, salami, champiñones y jalapeño', (SELECT id FROM categories WHERE name = 'Premium'), NOW(), NOW()),
('Azteca', 'Frijoles, tocino, chorizo, cebolla, y chiles en escabeche', (SELECT id FROM categories WHERE name = 'Premium'), NOW(), NOW());

-- Tradicional
INSERT INTO products(name, description, id_category, created_at, updated_at) VALUES
('Hawaiana', 'Jamon y piña', (SELECT id FROM categories WHERE name = 'Tradicional'), NOW(), NOW()),
('Chorimix', 'Piña, chorizo, jalapeño', (SELECT id FROM categories WHERE name = 'Tradicional'), NOW(), NOW()),
('Tropical', 'Piña, cereza y durazno', (SELECT id FROM categories WHERE name = 'Tradicional'), NOW(), NOW()),
('Peperoni', 'Peperoni', (SELECT id FROM categories WHERE name = 'Tradicional'), NOW(), NOW());

-- Especialidad
INSERT INTO products(name, description, id_category, created_at, updated_at) VALUES
('Dados', 'Peperoni, champiñones y pimiento morron', (SELECT id FROM categories WHERE name = 'Especialidad'), NOW(), NOW()),
('Marqueña', 'Jamon, tocino y champiñones', (SELECT id FROM categories WHERE name = 'Especialidad'), NOW(), NOW()),
('Chicken', 'Crema, pollo, rajas, elote y cebolla', (SELECT id FROM categories WHERE name = 'Especialidad'), NOW(), NOW()),
('Mitza', 'Jamon, tocino y chorizo', (SELECT id FROM categories WHERE name = 'Especialidad'), NOW(), NOW()),
('Salsiciia', 'Jamon, tocino, salchicha', (SELECT id FROM categories WHERE name = 'Especialidad'), NOW(), NOW()),
('Marianita', 'Jamon, tocino piña', (SELECT id FROM categories WHERE name = 'Especialidad'), NOW(), NOW());

-- Megamix (con precio fijo)
INSERT INTO products(name, description, price, id_category, created_at, updated_at) VALUES
('Megamix', 'Pizza cuadrada 4 especialidades - 16 rebanadas (mitza, hawaiana, especial y dados)', 269.00, (SELECT id FROM categories WHERE name = 'Megamix'), NOW(), NOW());

-- Bebidas (con precio fijo)
INSERT INTO products(name, description, price, id_category, created_at, updated_at) VALUES
('Agua 600ml', 'Agua embotellada de 600ml', 25.00, (SELECT id FROM categories WHERE name = 'Bebidas'), NOW(), NOW()),
('Refresco 600ml', 'Refresco de 600ml (varios sabores)', 27.00, (SELECT id FROM categories WHERE name = 'Bebidas'), NOW(), NOW()),
('Refresco 2lts', 'Refresco de 2 litros (varios sabores)', 49.00, (SELECT id FROM categories WHERE name = 'Bebidas'), NOW(), NOW());


-- SECCIÓN 4: Precios por Categoría y Tamaño
-- Precios Premium
INSERT INTO category_prices(id_category, id_size, price) VALUES
((SELECT id FROM categories WHERE name = 'Premium'), (SELECT id FROM sizes WHERE name = 'Personal'), 85.00),
((SELECT id FROM categories WHERE name = 'Premium'), (SELECT id FROM sizes WHERE name = 'Mediana'), 170.00),
((SELECT id FROM categories WHERE name = 'Premium'), (SELECT id FROM sizes WHERE name = 'Grande'), 190.00),
((SELECT id FROM categories WHERE name = 'Premium'), (SELECT id FROM sizes WHERE name = 'Familiar'), 220.00),
((SELECT id FROM categories WHERE name = 'Premium'), (SELECT id FROM sizes WHERE name = 'Cuadrada'), 285.00);

-- Precios Tradicional
INSERT INTO category_prices(id_category, id_size, price) VALUES
((SELECT id FROM categories WHERE name = 'Tradicional'), (SELECT id FROM sizes WHERE name = 'Personal'), 75.00),
((SELECT id FROM categories WHERE name = 'Tradicional'), (SELECT id FROM sizes WHERE name = 'Mediana'), 160.00),
((SELECT id FROM categories WHERE name = 'Tradicional'), (SELECT id FROM sizes WHERE name = 'Grande'), 180.00),
((SELECT id FROM categories WHERE name = 'Tradicional'), (SELECT id FROM sizes WHERE name = 'Familiar'), 210.00),
((SELECT id FROM categories WHERE name = 'Tradicional'), (SELECT id FROM sizes WHERE name = 'Cuadrada'), 245.00);

-- Precios Especialidad
INSERT INTO category_prices(id_category, id_size, price) VALUES
((SELECT id FROM categories WHERE name = 'Especialidad'), (SELECT id FROM sizes WHERE name = 'Personal'), 80.00),
((SELECT id FROM categories WHERE name = 'Especialidad'), (SELECT id FROM sizes WHERE name = 'Mediana'), 165.00),
((SELECT id FROM categories WHERE name = 'Especialidad'), (SELECT id FROM sizes WHERE name = 'Grande'), 185.00),
((SELECT id FROM categories WHERE name = 'Especialidad'), (SELECT id FROM sizes WHERE name = 'Familiar'), 215.00),
((SELECT id FROM categories WHERE name = 'Especialidad'), (SELECT id FROM sizes WHERE name = 'Cuadrada'), 255.00);

-- SECCIÓN 5: Addons y sus Precios
-- Addons
INSERT INTO addons(name, created_at, updated_at) VALUES
('Ingrediente Extra', NOW(), NOW()),
('Orilla de Queso Extra', NOW(), NOW());

-- Precios de Addons
INSERT INTO addon_prices(id_addon, id_size, price) VALUES
-- Ingrediente Extra
((SELECT id FROM addons WHERE name = 'Ingrediente Extra'), (SELECT id FROM sizes WHERE name = 'Personal'), 13.00),
((SELECT id FROM addons WHERE name = 'Ingrediente Extra'), (SELECT id FROM sizes WHERE name = 'Mediana'), 18.00),
((SELECT id FROM addons WHERE name = 'Ingrediente Extra'), (SELECT id FROM sizes WHERE name = 'Grande'), 23.00),
((SELECT id FROM addons WHERE name = 'Ingrediente Extra'), (SELECT id FROM sizes WHERE name = 'Familiar'), 28.00),
((SELECT id FROM addons WHERE name = 'Ingrediente Extra'), (SELECT id FROM sizes WHERE name = 'Cuadrada'), 35.00),
-- Orilla de Queso Extra
((SELECT id FROM addons WHERE name = 'Orilla de Queso Extra'), (SELECT id FROM sizes WHERE name = 'Personal'), 23.00),
((SELECT id FROM addons WHERE name = 'Orilla de Queso Extra'), (SELECT id FROM sizes WHERE name = 'Mediana'), 33.00),
((SELECT id FROM addons WHERE name = 'Orilla de Queso Extra'), (SELECT id FROM sizes WHERE name = 'Grande'), 33.00),
((SELECT id FROM addons WHERE name = 'Orilla de Queso Extra'), (SELECT id FROM sizes WHERE name = 'Familiar'), 43.00),
((SELECT id FROM addons WHERE name = 'Orilla de Queso Extra'), (SELECT id FROM sizes WHERE name = 'Cuadrada'), 47.00);
`;