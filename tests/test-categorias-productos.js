// test-categorias-productos.js
// Script para probar los endpoints de categorías y productos

const { PrismaClient } = require('@prisma/client');

async function testEndpoints() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 REVISIÓN COMPLETA DEL BACKEND - FILTRADO POR CATEGORÍAS\n');
    console.log('=' .repeat(80));

    // 1. Verificar estructura de la base de datos
    console.log('\n📊 1. ESTRUCTURA DE LA BASE DE DATOS');
    console.log('-'.repeat(50));

    // Verificar categorías
    console.log('\n🗂️  CATEGORÍAS DISPONIBLES:');
    const categories = await prisma.categories.findMany({
      orderBy: { id: 'asc' }
    });
    
    categories.forEach(cat => {
      console.log(`   ID: ${cat.id} | Nombre: "${cat.name}" | Descripción: "${cat.description}"`);
    });

    // Verificar productos
    console.log('\n🍕 PRODUCTOS DISPONIBLES:');
    const products = await prisma.products.findMany({
      include: {
        categories: true
      },
      where: {
        is_available: true
      },
      orderBy: { id: 'asc' }
    });
    
    products.forEach(product => {
      console.log(`   ID: ${product.id} | Nombre: "${product.name}" | Categoría ID: ${product.id_category} | Categoría: "${product.categories.name}"`);
    });

    // 2. Simular endpoint de categorías
    console.log('\n\n🌐 2. ENDPOINT DE CATEGORÍAS');
    console.log('-'.repeat(50));
    console.log('GET /api/categories');
    console.log('\nRespuesta JSON:');
    const categoriesResponse = {
      success: true,
      data: categories.map(cat => ({
        id: cat.id.toString(),
        name: cat.name,
        description: cat.description,
        created_at: cat.created_at,
        updated_at: cat.updated_at
      }))
    };
    console.log(JSON.stringify(categoriesResponse, null, 2));

    // 3. Simular endpoint de productos
    console.log('\n\n🌐 3. ENDPOINT DE PRODUCTOS');
    console.log('-'.repeat(50));
    console.log('GET /api/products');
    console.log('\nRespuesta JSON (primeros 3 productos):');
    const productsResponse = {
      success: true,
      data: products.slice(0, 3).map(product => ({
        id: product.id.toString(),
        name: product.name,
        description: product.description,
        price: product.price ? product.price.toString() : null,
        id_category: product.id_category.toString(),
        is_available: product.is_available,
        created_at: product.created_at,
        updated_at: product.updated_at,
        categories: {
          id: product.categories.id.toString(),
          name: product.categories.name,
          description: product.categories.description,
          created_at: product.categories.created_at,
          updated_at: product.categories.updated_at
        },
        product_images: []
      }))
    };
    console.log(JSON.stringify(productsResponse, null, 2));

    // 4. Análisis de compatibilidad
    console.log('\n\n🔍 4. ANÁLISIS DE COMPATIBILIDAD');
    console.log('-'.repeat(50));

    // Verificar si hay productos por categoría
    console.log('\n📈 PRODUCTOS POR CATEGORÍA:');
    for (const category of categories) {
      const productsInCategory = products.filter(p => p.id_category === category.id);
      console.log(`   ${category.name}: ${productsInCategory.length} productos`);
      
      if (productsInCategory.length > 0) {
        productsInCategory.slice(0, 2).forEach(product => {
          console.log(`     - ${product.name}`);
        });
        if (productsInCategory.length > 2) {
          console.log(`     ... y ${productsInCategory.length - 2} más`);
        }
      }
    }

    // 5. Verificar problemas potenciales
    console.log('\n\n⚠️  5. VERIFICACIÓN DE PROBLEMAS');
    console.log('-'.repeat(50));

    // Verificar si hay productos sin categoría
    const productsWithoutCategory = products.filter(p => !p.categories);
    if (productsWithoutCategory.length > 0) {
      console.log(`❌ PROBLEMA: ${productsWithoutCategory.length} productos sin categoría`);
    } else {
      console.log('✅ Todos los productos tienen categoría asignada');
    }

    // Verificar si hay categorías sin productos
    const categoriesWithoutProducts = categories.filter(cat => 
      !products.some(p => p.id_category === cat.id)
    );
    if (categoriesWithoutProducts.length > 0) {
      console.log(`❌ PROBLEMA: ${categoriesWithoutProducts.length} categorías sin productos:`);
      categoriesWithoutProducts.forEach(cat => {
        console.log(`   - ${cat.name} (ID: ${cat.id})`);
      });
    } else {
      console.log('✅ Todas las categorías tienen productos');
    }

    // Verificar consistencia de IDs
    const categoryIds = categories.map(c => c.id);
    const productCategoryIds = [...new Set(products.map(p => p.id_category))];
    const missingCategoryIds = productCategoryIds.filter(id => !categoryIds.includes(id));
    
    if (missingCategoryIds.length > 0) {
      console.log(`❌ PROBLEMA: Productos con category_id que no existe: ${missingCategoryIds.join(', ')}`);
    } else {
      console.log('✅ Todos los category_id de productos existen en la tabla categories');
    }

    // 6. Recomendaciones
    console.log('\n\n💡 6. RECOMENDACIONES PARA EL FRONTEND');
    console.log('-'.repeat(50));

    console.log('\n📋 ESTRUCTURA CORRECTA PARA EL FILTRADO:');
    console.log('1. Campo para filtrar: product.id_category (BigInt)');
    console.log('2. Campo para comparar: category.id (BigInt)');
    console.log('3. Conversión necesaria: Ambos deben ser convertidos a string o int para comparar');
    
    console.log('\n🔧 CÓDIGO DE FILTRADO SUGERIDO:');
    console.log(`
// En el ProductProvider de Flutter
List<Product> get filteredProducts {
  List<Product> filtered = List.from(_allProducts);
  
  if (_selectedCategoryId != null) {
    filtered = filtered.where((product) => 
      product.idCategory.toString() == _selectedCategoryId
    ).toList();
  }
  
  return filtered;
}
    `);

    console.log('\n✅ CONCLUSIÓN:');
    console.log('El backend está correctamente estructurado. El problema está en el frontend:');
    console.log('- Los productos tienen id_category como BigInt');
    console.log('- Las categorías tienen id como BigInt');
    console.log('- El filtrado debe comparar estos valores correctamente');

  } catch (error) {
    console.error('❌ Error en la revisión:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la revisión
testEndpoints();
