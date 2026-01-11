import { config } from './config';
import { createApp } from './app';

const app = await createApp();

const port = config.port;
app.listen(port, () => {
  console.log(`🚀 HORNY META FORGE Backend running on port ${port}`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   OpenAI: ${config.openai.apiKey ? '✅' : '❌'}`);
  console.log(`   Supabase: ${config.supabase.url ? '✅' : '❌'}`);
});
