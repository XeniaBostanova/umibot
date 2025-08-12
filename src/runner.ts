import { chromium } from 'playwright';
import { cfg } from './config.js';
import { getActiveOffers, logPriceChange, updateSeenPrices } from './db.js';
import { scrapeOffers } from './scraper.js';
import { computeNewPrice } from './pricing.js';

const JITTER_MS = 20_000; // вежливая пауза между карточками

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runOnce() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (price-bot; +contact-youremail)',
  });
  try {
    const page = await context.newPage();
    const offers = await getActiveOffers();
    console.log(`Старт цикла: ${offers.length} карточек`);

    // Логин один раз до прохода по карточкам
    // Если кабинет разлогинивает — перенесите login внутрь цикла с проверкой сессии
    // @ts-ignore
    const { loginCabinet, updatePriceViaUI } = await import('./cabinet.js');
    await loginCabinet(context);

    for (const row of offers) {
      try {
        const list = await scrapeOffers(
          page,
          row.product_url,
          row.my_store_name
        );
        const my = list.find((x) => x.isMe);
        const others = list.filter((x) => !x.isMe);
        if (!my) {
          await logPriceChange(
            row.id,
            undefined,
            undefined,
            'Наш оффер не найден на карточке'
          );
          continue;
        }
        if (!others.length) {
          await updateSeenPrices(row.id, my.price, undefined);
          continue;
        }

        const minCompetitor = Math.min(...others.map((x) => x.price));
        const step = Number(row.price_step);
        const minPrice = Number(row.min_price);
        const newPrice = computeNewPrice(
          my.price,
          minCompetitor,
          step,
          minPrice
        );

        await updateSeenPrices(row.id, my.price, minCompetitor);

        if (newPrice && newPrice >= minPrice) {
          await updatePriceViaUI(
            page,
            row.my_offer_edit_url,
            row.product_url,
            newPrice
          );
          await logPriceChange(
            row.id,
            my.price,
            newPrice,
            `Undercut to ${newPrice.toFixed(2)} vs ${minCompetitor.toFixed(2)}`
          );
          console.log(`[OK] ${row.product_url} -> ${newPrice.toFixed(2)}`);
          // Небольшая пауза после апдейта
          await sleep(3_000);
        } else {
          console.log(
            `[SKIP] ${row.product_url} — мы не дороже или порог/минимум`
          );
        }
      } catch (e: any) {
        console.error(`[ERR] ${row.product_url}:`, e?.message || e);
        await logPriceChange(
          row.id,
          undefined,
          undefined,
          `ERROR: ${e?.message || e}`
        );
      }

      // Джиттер между карточками, чтобы не долбить сайт
      await sleep(5_000 + Math.random() * JITTER_MS);
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

runOnce().catch((err) => {
  console.error('Фатальная ошибка:', err);
  process.exit(1);
});
