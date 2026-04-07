-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "contentform" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100),
    "url" VARCHAR(2083),
    "owner" VARCHAR(50),
    "persona" VARCHAR(50),
    "date_modified" DATE,
    "expiration_date" DATE,
    "content_type" VARCHAR(50),
    "status" VARCHAR(50),

    CONSTRAINT "contentform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee" (
    "eid" SERIAL NOT NULL,
    "first_name" VARCHAR(50),
    "last_name" VARCHAR(50),
    "persona" VARCHAR(50),
    "email" VARCHAR(50),
    "salary" DECIMAL(10,2),
    "password_hash" VARCHAR(255),

    CONSTRAINT "employee_pkey" PRIMARY KEY ("eid")
);

-- CreateTable
CREATE TABLE "employee_manage" (
    "emid" SERIAL NOT NULL,
    "full_name" VARCHAR(100),
    "edits" VARCHAR(50),
    "personstatus" VARCHAR(50),
    "priority" VARCHAR(50),
    "email" VARCHAR(50),
    "comments" VARCHAR(1000),

    CONSTRAINT "employee_manage_pkey" PRIMARY KEY ("emid")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_email_key" ON "employee"("email");
