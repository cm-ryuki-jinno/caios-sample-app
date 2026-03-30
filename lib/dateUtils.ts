/**
 * 【機能概要】: date-fns v2.30.0 を使用した日付ユーティリティ（TASK-0003 本実装）
 * 【実装方針】: date-fns v2系の直接importを使用。v3でimportパス変更により意図的にテスト失敗させるデモ設計（REQ-007対応）
 * 【改善内容】: Refactorフェーズで以下を改善:
 *   1. MS_PER_DAY 定数を抽出してマジックナンバーを排除（DRY原則）
 *   2. isOverdue() に明確なエラーメッセージ付き入力バリデーションを追加
 *   3. formatRelative() の未来日付（負のdiffDays）を明示的に処理
 * 【テスト対応】: TC-001〜TC-012, REQ-007確認テストの全13件を通す
 * 🔵 信頼性レベル: date-fns-utils-red-phase.md の「Greenフェーズで実装すべき内容」に直接対応
 */

// 【import定義】: date-fns v2のサブパスimport（v3で削除されテスト失敗→ロールバック発動のデモシナリオ）
// 🔵 REQ-010「format/parseISO/isAfter直接使用」、REQ-007「v3でimportパス変更で確実に失敗」に対応
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import isAfter from 'date-fns/isAfter';
import { ja } from 'date-fns/locale';

// 【設定定数】: 1日のミリ秒数（24時間 × 60分 × 60秒 × 1000ミリ秒）
// 【改善内容】: マジックナンバー (1000 * 60 * 60 * 24) を名前付き定数に抽出してDRY原則を適用
// 【調整可能性】: 日数計算の基準値。タイムゾーン調整が必要な場合はこの定数を基に計算する
// 🔵 信頼性レベル: 算術的定義から直接算出
const MS_PER_DAY = 1000 * 60 * 60 * 24; // 86,400,000ミリ秒

/**
 * 【機能概要】: ISO 8601文字列を「M月d日(E)」形式の日本語ロケールでフォーマットする
 * 【改善内容】: Greenフェーズの実装から変更なし。コメントの整理のみ
 * 【設計方針】: parseISO() でパース後、format() + ja ロケールで日本語曜日を含む形式に変換。
 *              無効な入力は parseISO/format が例外をスローするため、呼び出し元がハンドリングする
 * 【パフォーマンス】: O(1) - 定数時間処理。date-fns の parseISO + format は軽量
 * 【保守性】: フォーマット文字列 'M月d日(E)' を変更するだけで出力形式を調整可能
 * 🔵 信頼性レベル: TASK-0003タスク定義の実装詳細・date-fns-utils-requirements.md 2.1に直接対応
 * @param {string} isoString - ISO 8601形式の日付文字列（例: "2026-03-29T10:00:00.000Z"）
 * @returns {string} 「M月d日(E)」形式の日付文字列（例: "3月29日(土)"）
 * @throws {RangeError|Error} 無効なISO文字列が渡された場合（parseISO/formatが例外をスロー）
 */
export function formatDate(isoString: string): string {
  // 【入力パース】: parseISO() で ISO 8601文字列を Date オブジェクトに変換
  // 【エラー設計】: 無効な文字列（'invalid', ''など）はparseISO/formatが例外をスロー（TC-008, TC-009対応）
  // 🔵 REQ-010「parseISO直接使用」に対応
  const date = parseISO(isoString);

  // 【フォーマット実行】: date-fns v2 の format() + ja ロケールで日本語曜日付きフォーマット
  // 【フォーマット文字列】: 'M月d日(E)' → "3月29日(土)" のような出力
  // 🔵 date-fns-utils-requirements.md 2.1「出力形式: M月d日(E)形式（日本語ロケール）」に直接対応
  return format(date, 'M月d日(E)', { locale: ja });
}

/**
 * 【機能概要】: 期限日時が現在時刻よりも過去かどうかを判定する
 * 【改善内容】: 空文字列・null的な無効入力に対して明確なエラーメッセージを追加
 * 【設計方針】: date-fns の isAfter(現在時刻, 期限) を使用。同時刻はfalse（isAfterは厳密に後の場合のみtrue）
 * 【パフォーマンス】: O(1) - 定数時間処理
 * 【保守性】: エラーメッセージを変更するだけで呼び出し元のデバッグ支援が可能
 * 🔵 信頼性レベル: TASK-0003タスク定義の実装詳細・date-fns-utils-requirements.md 2.2に直接対応
 * @param {string} deadline - ISO 8601形式の期限日時文字列（例: "2026-03-29T10:00:00.000Z"）
 * @returns {boolean} 現在時刻が期限より後なら true、そうでなければ false
 * @throws {Error} 空文字列などの明らかに無効な入力が渡された場合
 */
export function isOverdue(deadline: string): boolean {
  // 【入力バリデーション】: 空文字列は parseISO が Invalid Date を返すため早期エラーを発生させる
  // 【改善内容】: Greenフェーズでは未実装だったエラーハンドリングを追加
  // 【ユーザビリティ】: 開発者にとって分かりやすいエラーメッセージを提供してデバッグを支援
  // 🔵 date-fns-utils-green-phase.md「isOverdueのエラーハンドリングが未実装」の改善対応
  if (!deadline) {
    throw new Error('isOverdue: deadline は空文字列ではなく有効なISO 8601文字列を指定してください');
  }

  // 【期限パース】: parseISO() で期限日時をDate オブジェクトに変換
  // 🔵 REQ-010「parseISO直接使用」に対応
  const deadlineDate = parseISO(deadline);

  // 【期限判定】: isAfter(現在時刻, 期限) = 現在時刻が期限より後の場合 true
  // 【セマンティクス】: isAfterは「厳密に後」のため、同時刻はfalse（TC-010対応）
  // 🔵 date-fns-utils-requirements.md 2.2「isAfter(new Date(), parseISO(deadline))」に直接対応
  return isAfter(new Date(), deadlineDate);
}

/**
 * 【機能概要】: ISO 8601文字列から相対時間表示（"今日", "昨日", "N日前"）を返す
 * 【改善内容】: 未来日付（負のdiffDays）を明示的に処理。MS_PER_DAY定数を使用してマジックナンバーを排除
 * 【設計方針】: ミリ秒差分を計算し、Math.floor で日数に変換。date-fns の format系関数ではなく手動計算
 *              （date-fns の formatDistance はロケール依存で不安定なためシンプルな手動計算を採用）
 * 【パフォーマンス】: O(1) - 定数時間処理。算術演算のみで外部呼び出しなし
 * 【保守性】: MS_PER_DAY定数と分岐パターンを分離したことで、将来の拡張（"N時間前" 等）が容易
 * 🔵 信頼性レベル: TASK-0003タスク定義の実装詳細・date-fns-utils-requirements.md 2.3に直接対応
 * @param {string} isoString - ISO 8601形式の日付文字列（例: "2026-03-29T10:00:00.000Z"）
 * @returns {string} "今日" | "昨日" | "{N}日前" の相対時間文字列
 */
export function formatRelative(isoString: string): string {
  // 【入力パース】: parseISO() でISO 8601文字列をDate オブジェクトに変換
  // 🔵 REQ-010「parseISO直接使用」に対応
  const date = parseISO(isoString);

  // 【ミリ秒差分計算】: 現在時刻と入力日時の差分をミリ秒で計算
  // 【設計方針】: date-fns のformatDistance等は使わず手動計算（テスト安定性のため）
  // 🔵 date-fns-utils-requirements.md 2.3「ミリ秒差分を日数に変換（Math.floor）」に直接対応
  const diffMs = Date.now() - date.getTime();

  // 【日数変換】: ミリ秒 → 日数に変換（Math.floorで切り捨て）
  // 【定数使用】: MS_PER_DAY（86,400,000ms）を使用してマジックナンバーを排除
  // 🔵 改善内容: (1000 * 60 * 60 * 24) → MS_PER_DAY に置き換えDRY原則を適用
  const diffDays = Math.floor(diffMs / MS_PER_DAY);

  // 【未来日付処理】: 負のdiffDays（未来の日付が渡された場合）を明示的に処理
  // 【改善内容】: Greenフェーズで「未定義動作」だった未来日付を仕様外として扱う
  // 【設計方針】: 仕様外入力（未来日付）は '今日' と同じ扱いにするよりも呼び出し元に任せる
  // 🟡 date-fns-utils-green-phase.md「formatRelativeの未来日付の挙動が未定義」の対応（仕様外動作の明示）
  if (diffDays < 0) return '今日'; // 【未来日付フォールバック】: 仕様外だが安全なデフォルト値として'今日'を返す

  // 【分岐処理】: 日数に応じて表示文字列を返す
  // 【今日判定】: 差分が0日（同日内、TC-005, TC-011対応）
  if (diffDays === 0) return '今日';

  // 【昨日判定】: 差分が1日（TC-006: 30時間前 = Math.floor(30/24) = 1）
  if (diffDays === 1) return '昨日';

  // 【N日前】: 差分が2日以上（TC-007: 75h前 = Math.floor(75/24) = 3日前, TC-012: 30日前）
  return `${diffDays}日前`;
}
