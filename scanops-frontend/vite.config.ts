import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // 고정 포트 + strictPort: 5173은 이 컴퓨터에서 다른 프로젝트가 상시 점유 중이라
    // Vite가 5174→5175→5176...으로 계속 밀려났다. 그때마다 백엔드의 GITHUB 리다이렉트
    // 대상(app.frontend-url)·CORS 허용 출처가 실제 포트와 어긋나는 문제가 반복됐다.
    // strictPort로 포트가 막혀 있으면 조용히 다른 포트로 넘어가지 말고 바로 에러를 내게 한다.
    port: 5190,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
