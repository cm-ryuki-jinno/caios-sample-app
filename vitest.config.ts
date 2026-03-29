import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * 【設定概要】: Vitest テスト実行設定
 * 【改善内容】: React 18 + @testing-library/user-event v14 + jsdom の組み合わせで
 *              発生するact() Warningを抑制するため onConsoleWarn を設定
 * 【設計方針】: act() Warningは @testing-library/user-event v14 内部実装と
 *              React 18のconcurrent mode batching の既知の相性問題。
 *              テスト動作には影響がないため、出力をフィルタリングして視認性を向上
 * 🔵 信頼性レベル: Vitest公式ドキュメント + React Testing Library GitHub issuesに基づく設定
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup.ts'],
    // 【コンソール設定】: act() Warningを抑制して出力をクリーンに保つ
    // 【対象Warning】: "not wrapped in act(...)" - @testing-library/user-event v14の既知の問題
    onConsoleLog(log: string): false | void {
      if (log.includes('not wrapped in act')) {
        return false; // 【フィルタリング】: act()警告を非表示にして出力をクリーンに保つ
      }
    },
  },
});
