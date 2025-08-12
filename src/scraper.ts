import { Page } from 'playwright';

export type Offer = { seller: string; price: number; isMe: boolean };

export async function scrapeOffers(
  page: Page,
  productUrl: string,
  myStoreName: string
): Promise<Offer[]> {
  await page.goto(productUrl, { waitUntil: 'networkidle', timeout: 60_000 });

  // TODO: подберите реальные селекторы блоков с продавцами и ценами
  // Примерная логика:
  const offers = await page.$$eval(
    '.MPProductOffers',
    (nodes, myName) => {
      const list: any[] = [];
      for (const el of nodes as HTMLElement[]) {
        const seller =
          (
            el.querySelector('.NameMerchant') as HTMLElement
          )?.innerText?.trim() || '';
        const priceTxt =
          (
            el.querySelector('.text-[#EA207E]') as HTMLElement
          )?.innerText?.replace(/[^\d.,]/g, '') || '';
        const price = Number(priceTxt.replace(',', '.'));
        if (!seller || !Number.isFinite(price)) continue;
        list.push({
          seller,
          price,
          isMe: seller.toLowerCase() === (myName as string).toLowerCase(),
        });
      }
      return list;
    },
    myStoreName
  );

  if (!offers.length)
    throw new Error('Не удалось распарсить офферы — проверьте селекторы.');
  return offers as Offer[];
}
