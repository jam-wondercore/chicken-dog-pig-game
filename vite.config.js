import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/chicken-dog-pig-game/',
  server: {
    host: false, // 監聽所有網路介面，讓區網可以連上
  },
})
