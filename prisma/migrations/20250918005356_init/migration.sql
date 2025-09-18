-- CreateTable
CREATE TABLE "public"."addons" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."addon_prices" (
    "id" BIGSERIAL NOT NULL,
    "id_addon" BIGINT NOT NULL,
    "id_size" BIGINT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "addon_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."address" (
    "id" BIGSERIAL NOT NULL,
    "id_user" BIGINT NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "neighborhood" VARCHAR(180) NOT NULL,
    "alias" VARCHAR(100),
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."branches" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "phone" VARCHAR(20),
    "created_at" TIMESTAMP(0) NOT NULL,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."category_prices" (
    "id" BIGSERIAL NOT NULL,
    "id_category" BIGINT NOT NULL,
    "id_size" BIGINT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "category_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_has_products" (
    "id" BIGSERIAL NOT NULL,
    "id_order" BIGINT NOT NULL,
    "id_product" BIGINT NOT NULL,
    "id_size" BIGINT,
    "quantity" INTEGER NOT NULL,
    "price_per_unit" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "order_has_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_item_addons" (
    "id" BIGSERIAL NOT NULL,
    "id_order_has_product" BIGINT NOT NULL,
    "id_addon" BIGINT NOT NULL,
    "price_at_purchase" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "order_item_addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."orders" (
    "id" BIGSERIAL NOT NULL,
    "id_client" BIGINT NOT NULL,
    "id_delivery" BIGINT,
    "id_address" BIGINT NOT NULL,
    "id_branch" BIGINT NOT NULL,
    "status" VARCHAR(90) NOT NULL,
    "payment_method" VARCHAR(50) NOT NULL DEFAULT 'Efectivo',
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "delivery_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(0) NOT NULL,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_images" (
    "id" BIGSERIAL NOT NULL,
    "id_product" BIGINT NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."products" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2),
    "id_category" BIGINT NOT NULL,
    "is_available" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(0) NOT NULL,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(90) NOT NULL,
    "image" VARCHAR(255),
    "route" VARCHAR(180) NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sizes" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "sizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_has_roles" (
    "id_user" BIGINT NOT NULL,
    "id_rol" BIGINT NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "user_has_roles_pkey" PRIMARY KEY ("id_user","id_rol")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" BIGSERIAL NOT NULL,
    "email" VARCHAR(180) NOT NULL,
    "name" VARCHAR(90) NOT NULL,
    "lastname" VARCHAR(90) NOT NULL,
    "notification_token" VARCHAR(255),
    "phone" VARCHAR(90) NOT NULL,
    "image" VARCHAR(255),
    "password" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL,
    "updated_at" TIMESTAMP(0) NOT NULL,
    "id_branch" BIGINT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "addons_name_key" ON "public"."addons"("name");

-- CreateIndex
CREATE UNIQUE INDEX "addon_prices_id_addon_id_size_key" ON "public"."addon_prices"("id_addon", "id_size");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "public"."categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "category_prices_id_category_id_size_key" ON "public"."category_prices"("id_category", "id_size");

-- CreateIndex
CREATE UNIQUE INDEX "products_name_key" ON "public"."products"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "public"."roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sizes_name_key" ON "public"."sizes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "public"."users"("phone");

-- AddForeignKey
ALTER TABLE "public"."addon_prices" ADD CONSTRAINT "addon_prices_id_addon_fkey" FOREIGN KEY ("id_addon") REFERENCES "public"."addons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."addon_prices" ADD CONSTRAINT "addon_prices_id_size_fkey" FOREIGN KEY ("id_size") REFERENCES "public"."sizes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."address" ADD CONSTRAINT "address_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."category_prices" ADD CONSTRAINT "category_prices_id_category_fkey" FOREIGN KEY ("id_category") REFERENCES "public"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."category_prices" ADD CONSTRAINT "category_prices_id_size_fkey" FOREIGN KEY ("id_size") REFERENCES "public"."sizes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_has_products" ADD CONSTRAINT "order_has_products_id_order_fkey" FOREIGN KEY ("id_order") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_has_products" ADD CONSTRAINT "order_has_products_id_product_fkey" FOREIGN KEY ("id_product") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_has_products" ADD CONSTRAINT "order_has_products_id_size_fkey" FOREIGN KEY ("id_size") REFERENCES "public"."sizes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_item_addons" ADD CONSTRAINT "order_item_addons_id_addon_fkey" FOREIGN KEY ("id_addon") REFERENCES "public"."addons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_item_addons" ADD CONSTRAINT "order_item_addons_id_order_has_product_fkey" FOREIGN KEY ("id_order_has_product") REFERENCES "public"."order_has_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_id_address_fkey" FOREIGN KEY ("id_address") REFERENCES "public"."address"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_id_branch_fkey" FOREIGN KEY ("id_branch") REFERENCES "public"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_id_client_fkey" FOREIGN KEY ("id_client") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_id_delivery_fkey" FOREIGN KEY ("id_delivery") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_images" ADD CONSTRAINT "product_images_id_product_fkey" FOREIGN KEY ("id_product") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_id_category_fkey" FOREIGN KEY ("id_category") REFERENCES "public"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_has_roles" ADD CONSTRAINT "user_has_roles_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_has_roles" ADD CONSTRAINT "user_has_roles_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_id_branch_fkey" FOREIGN KEY ("id_branch") REFERENCES "public"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
