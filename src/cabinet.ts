import { BrowserContext, Page } from 'playwright';
import { cfg } from './config.js';

export async function loginCabinet(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();
  await page.goto(cfg.CABINET_LOGIN_URL, {
    waitUntil: 'networkidle',
    timeout: 60_000,
  });

  // TODO: селекторы полей логина в кабинете продавца
  await page.fill(
    'input[type="text"].tw-text-umico-text-primary tw-pl-0',
    process.env.UMICO_LOGIN!
  );
  // await page.click('button:has-text("Далее"), button:has-text("İrəli")');
  // Если второй шаг — пароль/OTP:
  await page.fill(
    'input[type="password"].tw-text-umico-text-primary tw-pl-0',
    process.env.UMICO_PASSWORD!
  );
  await page.click('button:has-text("Войти"), button:has-text("Daxil ol")');

  await page.waitForLoadState('networkidle');

  // TODO: возможно, после логина кабинет редиректит на дашборд
  return page;
}

export async function updatePriceViaUI(
  page: Page,
  offerEditUrl: string | null,
  productUrl: string,
  newPrice: number
) {
  //Открываем страницу со списком офферов
  await page.goto('https://business.umico.az/ru/account/products/my');

  // 3. Собираем все ссылки на редактирование офферов
  const offerEditUrls = await page.$$eval(
    '.tw-min-h-[76px] sm:tw-rounded-none tw-pt-4 tw-pl-4 tw-pr-2 tw-pb-3 sm:tw-px-6 sm:tw-py-2 tw-justify-between tw-w-full tw-bg-white tw-border-t tw-border-l tw-border-r tw-border-umico-brand-main-brand-third tw-rounded-t-lg tw-border-b tw-rounded-b-lg tw-flex tw-h-[135px] sm:tw-h-16',
    (nodes) => nodes.map((a) => (a as HTMLAnchorElement).href)
  );

  console.log(`Найдено офферов: ${offerEditUrls.length}`);

  // 4. Перебираем все офферы и обновляем
  for (const url of offerEditUrls) {
    console.log(`Редактируем оффер: ${url}`);
    await page.goto(url);
    // TODO: селектор поля цены:
    await page.fill('.tw-text-umico-text-second tw-pl-0', newPrice.toFixed(2));
    // TODO: селектор кнопки "Сохранить":
    await page.click(
      'button:has-text("Сохранить"), button:has-text("Yadda saxla")'
    );

    // Подтверждение успеха (toast/snackbar)
    await page.waitForSelector('.toast-success, [data-test="save-success"]', {
      timeout: 15_000,
    });
  }
}
