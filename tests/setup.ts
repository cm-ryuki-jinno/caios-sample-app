import '@testing-library/jest-dom';

/**
 * 【テスト環境設定】: React 18の act() 環境フラグを有効化
 * 【改善内容】: IS_REACT_ACT_ENVIRONMENT = true を設定することで
 *              React 18のact()に関する警告（"not wrapped in act(...)"）を解消
 * 【設計方針】: @testing-library/react 14 は React 18 のconcurrent modeに対応しているが、
 *              jsdom環境では明示的にact()環境であることを宣言する必要がある
 * 🔵 信頼性レベル: React 18 + @testing-library公式ドキュメントに基づく設定
 */
// @ts-expect-error: グローバル変数への型なし代入（React 18 act()環境宣言に必要）
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
