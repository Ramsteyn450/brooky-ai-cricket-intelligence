import 'dotenv/config';
import { createApp } from './app.js';

const PORT = Number(process.env.PORT || 3001);
const isVercel = Boolean(process.env.VERCEL);
const app = createApp({ serveStatic: !isVercel });

if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`BROOKY AI server listening on http://localhost:${PORT}`);
  });
}

export default app;
