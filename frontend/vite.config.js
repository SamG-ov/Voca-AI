import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig(({ mode }) => {
  const plugins = [react(), tailwindcss()]

  // "npm run dev:phone" opens the app to my wifi network over https,
  // because phones only allow the microphone on https pages
  if (mode === 'phone') {
    plugins.push(basicSsl())
  }

  return {
    plugins: plugins,
    server: {
      host: mode === 'phone',
      proxy: {
        '/api': 'http://localhost:8000',
      },
    },
  }
})
