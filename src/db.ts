import { Pool } from 'pg';
import { cfg } from './config.js';

export const pool = new Pool({ connectionString: cfg.DATABASE_URL });

export type OfferRow = {
  id: number;
  product_url: string;
  my_store_name: string;
  my_offer_edit_url: string | null;
  min_price: string; // numeric
  price_step: string; // numeric
  enabled: boolean;
};

export async function getActiveOffers(): Promise<OfferRow[]> {
  const r = await pool.query('select * from offers where enabled = true');
  return r.rows;
}

export async function logPriceChange(
  offerId: number,
  oldP?: number,
  newP?: number,
  reason?: string
) {
  await pool.query(
    'insert into price_changes(offer_id, old_price, new_price, reason) values($1,$2,$3,$4)',
    [offerId, oldP ?? null, newP ?? null, reason ?? null]
  );
}

export async function updateSeenPrices(
  offerId: number,
  myPrice?: number,
  compPrice?: number
) {
  await pool.query(
    'update offers set last_seen_my_price = coalesce($2, last_seen_my_price), last_competitor_price = coalesce($3, last_competitor_price), updated_at = now() where id=$1',
    [offerId, myPrice ?? null, compPrice ?? null]
  );
}
