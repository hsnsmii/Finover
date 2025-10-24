CREATE TABLE IF NOT EXISTS "watchlists" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "type" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "watchlists_user_id_type_idx" ON "watchlists" ("user_id", "type");

CREATE TABLE IF NOT EXISTS "watchlist_entries" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "watchlist_id" UUID NOT NULL REFERENCES "watchlists"("id") ON DELETE CASCADE,
    "symbol" TEXT NOT NULL,
    "quantity" DECIMAL(18, 4),
    "price" DECIMAL(18, 4),
    "note" TEXT,
    "trade_date" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "watchlist_entries_watchlist_id_idx" ON "watchlist_entries" ("watchlist_id");
