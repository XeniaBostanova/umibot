CREATE TABLE IF NOT EXISTS offers (
    id SERIAL PRIMARY KEY,
    product_name TEXT NOT NULL,
    edit_url TEXT NOT NULL UNIQUE,
    current_price NUMERIC(12,2),
    last_updated TIMESTAMP DEFAULT NOW()
);
