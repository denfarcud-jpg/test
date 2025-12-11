-- CreateTable
CREATE TABLE "bitrix_installation" (
    "member_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "client_endpoint" TEXT NOT NULL,
    "server_endpoint" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "installed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bitrix_installation_pkey" PRIMARY KEY ("member_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bitrix_installation_domain_key" ON "bitrix_installation"("domain");
