import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  UMICO_LOGIN: z.string().min(3),
  UMICO_PASSWORD: z.string().min(3),
  DATABASE_URL: z.string().url(),
  STORE_NAME: z.string().min(1), // как виден ваш магазин на карточке
  CABINET_LOGIN_URL: z
    .string()
    .default('https://business.umico.az/new/sign-in'),
});

export const cfg = schema.parse(process.env);
