/**
 * 【テストファイル概要】: タスク管理アプリのPlaywright E2Eテスト
 * 【対象機能】: TC-001-01〜TC-001-03, TC-DATE-01, TC-ERR-01, TC-BND-01〜03,
 *              TC-ADD-01〜02, TC-TOGGLE-01, TC-STYLE-01, TC-PERSIST-01,
 *              TC-DELETE-01〜02, TC-FILTER-01, TC-COUNT-01（計17件）
 * 【テストフェーズ】: Refactor完了（Red→Green→Refactorの全フェーズ完了）
 * 【テストフレームワーク】: Playwright (@playwright/test) 1.40.0
 * 【date-fnsバージョン】: 2.30.0 固定（v3でimportパス変更により意図的にテスト失敗デモ設計）
 * 【実行コマンド】: npm run test:e2e
 * 🔵 信頼性レベル: TASK-0004タスク定義・受け入れ基準TC-001-01〜TC-001-03・note.mdに直接対応
 */

import { test, expect } from '@playwright/test';

// ============================================================
// テストスイート: タスク管理アプリ
// ============================================================
test.describe('タスク管理アプリ', () => {
  // 【テスト前準備】: 各テスト実行前にlocalStorageを初期化し、テスト間の干渉を防止
  // 【環境初期化】: ページ遷移 → localStorage.clear() → リロードで純粋な初期状態を保証
  // 🔵 note.md「各テストケース前にlocalStorage.clear()実行」に直接対応
  test.beforeEach(async ({ page }) => {
    // 【ページアクセス】: テスト対象アプリのルートパスへ移動（baseURL: http://localhost:3000）
    await page.goto('/');

    // 【LocalStorage初期化】: 前のテストで保存されたデータを完全に削除
    // 【テストアイソレーション】: 各テストが独立して実行できるよう、データ汚染を防止
    await page.evaluate(() => localStorage.clear());

    // 【ページリロード】: LocalStorage初期化をReactのstateに反映させる
    // 【初期状態確認】: useEffectがlocalStorageを再読み込みし、空の状態になることを確認
    await page.reload();
  });

  // ============================================================
  // TC-001-01: タスク一覧表示テスト
  // ============================================================

  // 【テスト目的】: アプリ初期表示時にタスク一覧がブラウザレベルでレンダリングされることを確認
  // 【テスト内容】: ページアクセス後、data-testid="task-item"を持つ要素の可視性を検証
  // 【期待される動作】: Next.jsのハイドレーション完了後、UIが正しく表示される
  // 🔵 受け入れ基準TC-001-01・TASK-0004タスク定義に直接対応
  test('TC-001-01: タスク一覧が表示される', async ({ page }) => {
    // 【テストデータ準備】: 初期状態確認用のタスクを追加（localStorage.clear後はゼロのため追加が必要）
    // 【前提条件設定】: beforeEachでlocalStorageをクリアしたため、初期データがないことを踏まえて1件追加
    await page.getByTestId('task-input').fill('一覧確認用タスク');
    await page.getByTestId('add-button').click();

    // 【実際の処理実行】: data-testid="task-item"でタスク行要素を取得
    // 【処理内容】: getByTestIdでリスト内の全タスク行要素を参照
    const taskItems = page.getByTestId('task-item');

    // 【結果検証】: 最初のタスク項目が画面上に表示されていることを確認
    // 【期待値確認】: 追加したタスクがTaskItemコンポーネントとして表示される
    await expect(taskItems.first()).toBeVisible(); // 【確認内容】: task-item要素が1件以上表示されること 🔵
  });

  // ============================================================
  // TC-001-02: タスク追加テスト
  // ============================================================

  // 【テスト目的】: テキスト入力→追加ボタンクリックで新規タスクがリストに追加・表示されることを確認
  // 【テスト内容】: TaskFormコンポーネントの入力操作→TaskListへの反映をE2Eで検証
  // 【期待される動作】: 「テストタスク」が追加され、タスク名と日付要素が表示される
  // 🔵 受け入れ基準TC-001-02・TASK-0004タスク定義・TASK-0002 data-testid定義に直接対応
  test('TC-001-02: タスクを追加できる', async ({ page }) => {
    // 【テストデータ準備】: フォーム要素をdata-testidで取得
    // 【初期条件設定】: task-inputとadd-buttonが画面上に存在することを前提
    const input = page.getByTestId('task-input');
    const addButton = page.getByTestId('add-button');

    // 【実際の処理実行】: テキスト入力→追加ボタンクリックの一連の操作
    // 【処理内容】: fill()でテキスト入力、click()でフォーム送信をシミュレート
    await input.fill('テストタスク');
    await addButton.click();

    // 【結果検証1】: 追加したタスク名が画面上に表示されていることを確認
    // 【期待値確認】: TaskItemコンポーネントのspanにタスクタイトルが表示される
    await expect(page.getByText('テストタスク')).toBeVisible(); // 【確認内容】: 追加したタスク名が表示されること 🔵

    // 【結果検証2】: 日付表示要素が存在することを確認（date-fns連携の間接検証）
    // 【期待値確認】: TaskItemのdata-testid="task-date"に日付が表示される
    const dateEl = page.getByTestId('task-date').last();
    await expect(dateEl).toBeVisible(); // 【確認内容】: 追加タスクに日付要素が表示されること 🔵
  });

  // ============================================================
  // TC-001-03: タスク完了テスト
  // ============================================================

  // 【テスト目的】: チェックボックスをクリックしてタスクが完了状態に遷移できることを確認
  // 【テスト内容】: タスク追加→チェックボックス操作→完了状態検証のエンドツーエンドフロー
  // 【期待される動作】: task-checkboxがtoBeChecked()でtrue状態になる
  // 🔵 受け入れ基準TC-001-03・TASK-0004タスク定義・TASK-0002 data-testid定義に直接対応
  test('TC-001-03: タスクを完了にできる', async ({ page }) => {
    // 【テストデータ準備】: チェック操作対象のタスクを明示的に追加
    // 【前提条件確認】: タスクが存在しないとチェックボックスが表示されないため先に追加
    await page.getByTestId('task-input').fill('完了テストタスク');
    await page.getByTestId('add-button').click();

    // 【実際の処理実行】: 最後のタスクのチェックボックスをクリック
    // 【処理内容】: check()メソッドでチェック操作を実行（TaskItemのonToggle発火）
    const checkbox = page.getByTestId('task-checkbox').last();
    await checkbox.check();

    // 【結果検証】: チェックボックスがchecked状態になっていることを確認
    // 【期待値確認】: localStorageのcompleted状態がUIに反映される
    await expect(checkbox).toBeChecked(); // 【確認内容】: チェックボックスが完了状態になっていること 🔵
  });

  // ============================================================
  // TC-DATE-01: 日付フォーマット検証テスト
  // ============================================================

  // 【テスト目的】: date-fnsで生成された「X月X日」形式の日付がUIに表示されることを確認
  // 【テスト内容】: タスク追加後のtask-date要素を正規表現で検証
  // 【期待される動作】: formatDate()の出力（M月d日(E)形式）がUIに正しく反映される
  // 【破壊的変更デモ】: date-fns v3アップデート時はimportパス変更でこのテストが失敗する（REQ-007）
  // 🔵 REQ-010・TASK-0003 formatDate仕様・TASK-0004タスク定義に直接対応
  test('TC-DATE-01: 日付がdate-fnsでフォーマットされて表示される', async ({ page }) => {
    // 【テストデータ準備】: 日付検証専用のタスクを追加
    // 【前提条件設定】: date-fns 2.30.0でformatDate()が正常動作する状態
    await page.getByTestId('task-input').fill('日付テスト');
    await page.getByTestId('add-button').click();

    // 【実際の処理実行】: 最後のタスクの日付表示要素を取得
    // 【処理内容】: getByTestId('task-date').last()で最新追加タスクの日付要素を参照
    const dateEl = page.getByTestId('task-date').last();

    // 【結果検証】: 日付が「X月X日」形式であることを正規表現で確認
    // 【期待値確認】: formatDate()が'M月d日(E)'フォーマットで出力するため、\d+月\d+日にマッチする
    // 【REQ-007デモポイント】: date-fns v3では import { format } from 'date-fns' が解決不能になりここで失敗
    await expect(dateEl).toHaveText(/\d+月\d+日/); // 【確認内容】: 日付が「X月X日」形式で表示されること 🔵
  });

  // ============================================================
  // TC-ERR-01: 空文字バリデーションテスト
  // ============================================================

  // 【テスト目的】: 空文字でタスク追加操作を行った場合、タスクが追加されないことを確認
  // 【テスト内容】: 空入力で追加ボタンクリック後、タスク数が変化しないことを検証
  // 【期待される動作】: TaskFormのif(!title.trim()) returnバリデーションが機能する
  // 🟡 TASK-0002のTaskForm仕様「空文字ではonAddを呼ばない」から妥当な推測
  test('TC-ERR-01: 空文字でのタスク追加が無視される', async ({ page }) => {
    // 【テストデータ準備】: 追加操作前のタスク数を記録
    // 【初期条件設定】: beforeEachでlocalStorageをクリア済みのため、初期は0件
    const initialCount = await page.getByTestId('task-item').count();

    // 【実際の処理実行】: 空文字のまま追加ボタンをクリック
    // 【処理内容】: task-inputを空文字でfill()し、add-buttonをclickする操作
    await page.getByTestId('task-input').fill('');
    await page.getByTestId('add-button').click();

    // 【結果検証】: タスク数が増加していないことを確認
    // 【期待値確認】: TaskFormのバリデーション（!title.trim()）により空タスクが追加されない
    const afterCount = await page.getByTestId('task-item').count();
    expect(afterCount).toBe(initialCount); // 【確認内容】: タスク数が変化していないこと 🟡
  });

  // ============================================================
  // TC-BND-01: localStorage初期化後の動作テスト
  // ============================================================

  // 【テスト目的】: localStorage初期化後にアプリの主要UI要素が正常表示されることを確認
  // 【テスト内容】: beforeEachの初期化処理後、task-inputとadd-buttonが表示されているかを検証
  // 【期待される動作】: データ消失後もアプリが使用可能な状態を維持する
  // 🟡 TASK-0002のUI実装仕様・TASK-0004のbeforeEach処理から妥当な推測
  test('TC-BND-01: localStorage初期化後にアプリが正常表示される', async ({ page }) => {
    // 【前提条件確認】: beforeEachで既にlocalStorage.clear() + page.reload()済み

    // 【実際の処理実行】: アプリの主要UI要素をdata-testidで取得
    // 【処理内容】: task-inputとadd-buttonの存在を確認する
    const input = page.getByTestId('task-input');
    const addButton = page.getByTestId('add-button');

    // 【結果検証1】: 入力フィールドが表示されていることを確認
    // 【期待値確認】: localStorage消失後もTaskFormコンポーネントが正常にレンダリングされる
    await expect(input).toBeVisible(); // 【確認内容】: 入力フィールドが表示されること 🟡

    // 【結果検証2】: 追加ボタンが表示されていることを確認
    // 【期待値確認】: フォーム全体が正常にレンダリングされていることを確認
    await expect(addButton).toBeVisible(); // 【確認内容】: 追加ボタンが表示されること 🟡
  });

  // ============================================================
  // TC-BND-02: 長い文字列タスク追加テスト
  // ============================================================

  // 【テスト目的】: 100文字の長い日本語文字列でもタスクが正常に追加・表示されることを確認
  // 【テスト内容】: 「あ」×100文字を入力してタスク追加し、リストに表示されることを検証
  // 【期待される動作】: 長い文字列でもアプリがクラッシュせず、タスクが追加される
  // 🟡 一般的なUIテスト観点・境界値テストのベストプラクティスから妥当な推測
  test('TC-BND-02: 長い文字列のタスクが追加できる', async ({ page }) => {
    // 【テストデータ準備】: 100文字の日本語文字列を生成
    // 【境界値選択根拠】: 一般的なテキスト入力の実用的な上限付近での動作確認
    const longText = 'あ'.repeat(100);

    // 【実際の処理実行】: 長い文字列を入力してタスクを追加
    // 【処理内容】: fill()でマルチバイト100文字を入力し、click()で送信
    await page.getByTestId('task-input').fill(longText);
    await page.getByTestId('add-button').click();

    // 【結果検証】: 追加後にtask-item要素が1件以上存在することを確認
    // 【期待値確認】: 長い文字列でもlocalStorageに保存され、TaskItemとして表示される
    const lastItem = page.getByTestId('task-item').last();
    await expect(lastItem).toBeVisible(); // 【確認内容】: 追加されたタスクが表示されること 🟡
  });

  // ============================================================
  // TC-BND-03: 複数タスク連続追加テスト
  // ============================================================

  // 【テスト目的】: 3件のタスクを連続追加した際にすべて正しく表示されることを確認
  // 【テスト内容】: タスク1〜3を連続追加し、3件すべての表示とカウント増加を検証
  // 【期待される動作】: 連続操作でもlocalStorageへの書き込みが競合せず、全件表示される
  // 🟡 一般的なE2Eテスト観点・連続操作時の安定性確認から妥当な推測
  test('TC-BND-03: 複数タスクを連続して追加できる', async ({ page }) => {
    // 【テストデータ準備】: 追加前のタスク数を記録
    // 【初期条件設定】: beforeEachでlocalStorageをクリア済みのため0件
    const initialCount = await page.getByTestId('task-item').count();

    // 【実際の処理実行】: 3件のタスクを連続追加
    // 【処理内容】: 入力→クリック→入力→クリック→入力→クリックの連続操作をループで実行
    const tasks = ['タスク1', 'タスク2', 'タスク3'];
    for (const taskName of tasks) {
      await page.getByTestId('task-input').fill(taskName);
      await page.getByTestId('add-button').click();
    }

    // 【結果検証1】: 3件すべてのタスクが画面上に表示されていることを確認
    // 【期待値確認】: 各タスク名がTaskItemのspanに表示される
    for (const taskName of tasks) {
      await expect(page.getByText(taskName)).toBeVisible(); // 【確認内容】: 各タスクが表示されること 🟡
    }

    // 【結果検証2】: タスク数が正確に3件増加していることを確認
    // 【期待値確認】: localStorageへの連続書き込みが競合せず、全3件が正しく保存・表示される
    const afterCount = await page.getByTestId('task-item').count();
    expect(afterCount).toBe(initialCount + 3); // 【確認内容】: タスクが正確に3件増加していること 🟡
  });

  // ============================================================
  // TC-ADD-01: タスク追加後の入力フィールドクリアテスト
  // ============================================================

  // 【テスト目的】: タスク追加後に入力フィールドが空になることを確認
  // 【テスト内容】: タスク追加後のtask-inputの値が空文字であることを検証
  // 【期待される動作】: TaskFormのsetTitle('')が正常に動作し、フィールドがクリアされる
  // 🔵 TASK-0002 TaskFormコンポーネント「追加後、入力フィールドをクリア」に直接対応
  test('TC-ADD-01: タスク追加後に入力フィールドがクリアされる', async ({ page }) => {
    // 【テストデータ準備】: フォーム要素を取得
    const input = page.getByTestId('task-input');

    // 【実際の処理実行】: テキスト入力→追加ボタンクリック
    await input.fill('クリアテストタスク');
    await page.getByTestId('add-button').click();

    // 【結果検証】: 追加後に入力フィールドが空になっていることを確認
    // 【期待値確認】: TaskFormのhandleSubmit内でsetTitle('')が呼ばれてフィールドがリセットされる
    await expect(input).toHaveValue(''); // 【確認内容】: 入力フィールドがクリアされていること 🔵
  });

  // ============================================================
  // TC-ADD-02: Enterキーによるタスク追加テスト
  // ============================================================

  // 【テスト目的】: フォームのEnterキー送信でもタスクが追加できることを確認
  // 【テスト内容】: task-inputにEnterキーを押してタスク追加操作をシミュレート
  // 【期待される動作】: formのonSubmitが発火し、タスクが追加される
  // 🔵 TASK-0002 TaskFormコンポーネント「TC-003(Enterキー)」に直接対応
  test('TC-ADD-02: Enterキーでタスクを追加できる', async ({ page }) => {
    // 【テストデータ準備】: フォーム入力フィールドを取得
    const input = page.getByTestId('task-input');

    // 【実際の処理実行】: テキスト入力後にEnterキーを押す
    // 【処理内容】: fill()でテキスト入力、press('Enter')でフォーム送信をシミュレート
    await input.fill('Enterキーテストタスク');
    await input.press('Enter');

    // 【結果検証】: タスクが追加されていることを確認
    // 【期待値確認】: form要素のonSubmitイベントが発火し、addTask()が呼ばれてリストに反映
    await expect(page.getByText('Enterキーテストタスク')).toBeVisible(); // 【確認内容】: Enterキーでもタスクが追加されること 🔵
  });

  // ============================================================
  // TC-TOGGLE-01: タスク完了→未完了の切り替えテスト
  // ============================================================

  // 【テスト目的】: チェック済みのタスクを再クリックで未完了状態に戻せることを確認
  // 【テスト内容】: タスク追加→チェック→再チェック解除のE2Eフローを検証
  // 【期待される動作】: 2回クリックでチェックが外れ、未完了状態に戻る
  // 🔵 TASK-0002 TaskItemコンポーネント「TC-009(onToggle呼び出し)」・toggleTask()に直接対応
  test('TC-TOGGLE-01: タスクの完了状態をトグルできる', async ({ page }) => {
    // 【テストデータ準備】: 切り替え操作対象のタスクを追加
    await page.getByTestId('task-input').fill('トグルテストタスク');
    await page.getByTestId('add-button').click();

    // 【実際の処理実行1】: チェックボックスをチェック状態にする
    const checkbox = page.getByTestId('task-checkbox').last();
    await checkbox.check();

    // 【中間検証】: チェック済みであることを確認
    await expect(checkbox).toBeChecked(); // 【確認内容】: 完了状態になっていること 🔵

    // 【実際の処理実行2】: チェックボックスのチェックを外す（未完了に戻す）
    await checkbox.uncheck();

    // 【結果検証】: チェックが外れて未完了状態になっていることを確認
    await expect(checkbox).not.toBeChecked(); // 【確認内容】: 未完了状態に戻っていること 🔵
  });

  // ============================================================
  // TC-STYLE-01: タスク完了時のスタイル適用テスト
  // ============================================================

  // 【テスト目的】: タスク完了時にtask-itemの子要素に打ち消し線スタイルが適用されることを確認
  // 【テスト内容】: タスク追加→チェック→打ち消し線クラス（line-through）の適用を検証
  // 【期待される動作】: task.completed=trueの場合、spanに'line-through text-gray-400'クラスが付与される
  // 🔵 TASK-0002 TaskItemコンポーネント「TC-008(完了時打ち消し線)」に直接対応
  test('TC-STYLE-01: 完了タスクに打ち消し線スタイルが適用される', async ({ page }) => {
    // 【テストデータ準備】: スタイル確認用タスクを追加
    await page.getByTestId('task-input').fill('スタイルテストタスク');
    await page.getByTestId('add-button').click();

    // 【初期状態確認】: 完了前はline-throughクラスが付いていないことを確認
    const taskItem = page.getByTestId('task-item').last();
    const titleSpan = taskItem.locator('span').first();
    await expect(titleSpan).not.toHaveClass(/line-through/); // 【確認内容】: 未完了時はline-throughなし 🔵

    // 【実際の処理実行】: チェックボックスをチェックして完了状態にする
    await page.getByTestId('task-checkbox').last().check();

    // 【結果検証】: 完了後にline-throughクラスが適用されていることを確認
    await expect(titleSpan).toHaveClass(/line-through/); // 【確認内容】: 完了時はline-throughが適用されること 🔵
  });

  // ============================================================
  // TC-PERSIST-01: タスクのLocalStorage永続化テスト
  // ============================================================

  // 【テスト目的】: タスク追加後にページリロードしても、タスクが保持されることを確認
  // 【テスト内容】: タスク追加→ページリロード→タスクが再表示されることを検証
  // 【期待される動作】: saveTasks()でlocalStorageに保存され、loadTasks()で再読み込みされる
  // 🔵 app/page.tsx「TC-015(LocalStorage永続化)」・loadTasks/saveTasks仕様に直接対応
  test('TC-PERSIST-01: タスクがLocalStorageに永続化される', async ({ page }) => {
    // 【テストデータ準備】: 永続化確認用タスクを追加
    const taskName = '永続化テストタスク';
    await page.getByTestId('task-input').fill(taskName);
    await page.getByTestId('add-button').click();

    // 【中間確認】: タスクが追加されていることを確認
    await expect(page.getByText(taskName)).toBeVisible(); // 【確認内容】: 追加直後にタスクが表示されること

    // 【実際の処理実行】: ページをリロード（LocalStorageはそのまま保持）
    // 【処理内容】: page.reload()でReactのstateがリセットされ、useEffectでlocalStorageを再読み込み
    await page.reload();

    // 【結果検証】: リロード後もタスクが表示されていることを確認
    // 【期待値確認】: loadTasks()がlocalStorageからタスクを読み込み、setTasks()でstateに設定される
    await expect(page.getByText(taskName)).toBeVisible(); // 【確認内容】: リロード後もタスクが保持されること 🔵
  });

  // ============================================================
  // TC-DELETE-01: タスク削除テスト（未実装機能 - Redフェーズ）
  // ============================================================

  // 【テスト目的】: タスクの削除ボタンをクリックしてタスクが一覧から削除されることを確認
  // 【テスト内容】: タスク追加→削除ボタンクリック→タスクが一覧から消えることを検証
  // 【期待される動作】: data-testid="delete-button"を持つ削除ボタンが存在し、クリックでタスクが削除される
  // 【RED理由】: TaskItemコンポーネントに削除ボタン（data-testid="delete-button"）が未実装
  //              page.tsxにdeleteTask関数が未実装
  // 🔴 未実装機能のテスト - Greenフェーズで実装が必要
  test('TC-DELETE-01: タスクを削除できる', async ({ page }) => {
    // 【テストデータ準備】: 削除対象のタスクを追加
    // 【前提条件設定】: 削除操作対象タスクを明示的に作成
    const taskName = '削除テストタスク';
    await page.getByTestId('task-input').fill(taskName);
    await page.getByTestId('add-button').click();

    // 【中間確認】: タスクが追加されていることを確認
    await expect(page.getByText(taskName)).toBeVisible(); // 【確認内容】: 削除前にタスクが表示されること

    // 【実際の処理実行】: 削除ボタンの存在確認
    // 【処理内容】: data-testid="delete-button"で削除ボタンを取得して存在チェック
    // 【RED期待】: delete-buttonが未実装のため、toBeVisibleで即座に失敗する
    const deleteButton = page.getByTestId('delete-button').last();
    await expect(deleteButton).toBeVisible({ timeout: 3000 }); // 【RED】: delete-button要素が存在しないためここで失敗する

    // 【結果検証】: タスクが一覧から削除されていることを確認
    // 【期待値確認】: deleteTask()が呼ばれてタスクがstateから削除され、UIから消える
    await deleteButton.click();
    await expect(page.getByText(taskName)).not.toBeVisible(); // 【確認内容】: 削除後にタスクが表示されないこと 🔴
  });

  // ============================================================
  // TC-DELETE-02: 完了済みタスクのみ一括削除テスト（未実装機能 - Redフェーズ）
  // ============================================================

  // 【テスト目的】: 完了済みタスクを一括削除するボタンが機能することを確認
  // 【テスト内容】: 複数タスク追加→一部完了→一括削除ボタンクリック→完了タスクのみ削除を検証
  // 【期待される動作】: data-testid="clear-completed"ボタンで完了タスクが一括削除される
  // 【RED理由】: 一括削除機能（clear-completedボタン）が未実装
  // 🔴 未実装機能のテスト - Greenフェーズで実装が必要
  test('TC-DELETE-02: 完了済みタスクを一括削除できる', async ({ page }) => {
    // 【テストデータ準備】: 未完了タスクと完了タスクを追加
    await page.getByTestId('task-input').fill('未完了タスク');
    await page.getByTestId('add-button').click();
    await page.getByTestId('task-input').fill('完了タスク');
    await page.getByTestId('add-button').click();

    // 【完了操作】: 2件目のタスクを完了状態にする
    await page.getByTestId('task-checkbox').last().check();

    // 【実際の処理実行】: 完了済みタスク一括削除ボタンの存在確認
    // 【RED期待】: clear-completedボタンが未実装のため即座に失敗する
    const clearButton = page.getByTestId('clear-completed');
    await expect(clearButton).toBeVisible({ timeout: 3000 }); // 【RED】: clear-completed要素が存在しないためここで失敗する
    await clearButton.click();

    // 【結果検証】: 完了タスクのみ削除され、未完了タスクは残っていることを確認
    // 【Greenフェーズ修正】: exact: true を追加。「完了タスク」を「未完了タスク」スパンと区別するため
    // 【理由】: getByTextのデフォルト部分一致では「未完了タスク」内の「完了タスク」にもヒットするため
    await expect(page.getByText('未完了タスク', { exact: true })).toBeVisible(); // 【確認内容】: 未完了タスクは残っていること 🔴
    await expect(page.getByText('完了タスク', { exact: true })).not.toBeVisible(); // 【確認内容】: 完了タスクは削除されていること 🔴
  });

  // ============================================================
  // TC-FILTER-01: タスクフィルタリングテスト（未実装機能 - Redフェーズ）
  // ============================================================

  // 【テスト目的】: フィルタボタンで「全て」「未完了」「完了」のタスク表示を切り替えられることを確認
  // 【テスト内容】: タスク追加→完了→フィルタボタンクリック→表示切り替えを検証
  // 【期待される動作】: data-testid="filter-active"ボタンで未完了タスクのみ表示される
  // 【RED理由】: タスクフィルタリング機能が未実装
  // 🔴 未実装機能のテスト - Greenフェーズで実装が必要
  test('TC-FILTER-01: 未完了タスクのみフィルタリングできる', async ({ page }) => {
    // 【テストデータ準備】: 未完了・完了のタスクを混在させる
    await page.getByTestId('task-input').fill('未完了のタスク');
    await page.getByTestId('add-button').click();
    await page.getByTestId('task-input').fill('完了のタスク');
    await page.getByTestId('add-button').click();

    // 【完了操作】: 2件目のタスクを完了状態にする
    await page.getByTestId('task-checkbox').last().check();

    // 【実際の処理実行】: 未完了タスクのみ表示するフィルタボタンの存在確認
    // 【RED期待】: filter-activeボタンが未実装のため即座に失敗する
    const filterActiveButton = page.getByTestId('filter-active');
    await expect(filterActiveButton).toBeVisible({ timeout: 3000 }); // 【RED】: filter-active要素が存在しないためここで失敗する
    await filterActiveButton.click();

    // 【結果検証】: 未完了タスクのみ表示されていることを確認
    // 【Greenフェーズ修正】: exact: true を追加。「完了のタスク」を「未完了のタスク」スパンと区別するため
    // 【理由】: getByTextのデフォルト部分一致では「未完了のタスク」内の「完了のタスク」にもヒットするため
    await expect(page.getByText('未完了のタスク', { exact: true })).toBeVisible(); // 【確認内容】: 未完了タスクが表示されること 🔴
    await expect(page.getByText('完了のタスク', { exact: true })).not.toBeVisible(); // 【確認内容】: 完了タスクが非表示になること 🔴
  });

  // ============================================================
  // TC-COUNT-01: タスク残件数表示テスト（未実装機能 - Redフェーズ）
  // ============================================================

  // 【テスト目的】: 未完了タスクの件数が画面に表示されることを確認
  // 【テスト内容】: タスク追加→完了→カウント表示の変化を検証
  // 【期待される動作】: data-testid="task-count"要素に未完了タスク数が表示される
  // 【RED理由】: タスク残件数表示機能が未実装
  // 🔴 未実装機能のテスト - Greenフェーズで実装が必要
  test('TC-COUNT-01: 未完了タスクの残件数が表示される', async ({ page }) => {
    // 【Greenフェーズ修正】: 初期データを考慮した件数確認に変更
    // 【理由】: localStorage.clear()後のリロード時、storage.tsのgetInitialTasks()が
    //          「AWS環境の確認（未完了）」「月次レポート作成（完了）」の2件を返す
    //          そのため3件追加後の未完了タスク数は 1(初期) + 3(追加) = 4件になる
    // 【対策】: 初期の未完了タスク数を事前取得し、追加後の件数変化で検証する

    // 【テスト前処理】: 初期の未完了件数をtask-countから取得
    const taskCount = page.getByTestId('task-count');
    await expect(taskCount).toBeVisible(); // 【確認内容】: task-count要素が表示されること

    // 【初期件数確認】: task-count要素のテキストから初期未完了件数を読み取る
    const initialCountText = await taskCount.textContent() ?? '0件';
    const initialActiveCount = parseInt(initialCountText.replace('件', ''), 10);

    // 【テストデータ準備】: 3件の未完了タスクを追加
    const tasks = ['カウントタスク1', 'カウントタスク2', 'カウントタスク3'];
    for (const taskName of tasks) {
      await page.getByTestId('task-input').fill(taskName);
      await page.getByTestId('add-button').click();
    }

    // 【結果検証】: 3件追加後、初期件数+3が表示されていること
    // 【期待値計算】: 初期未完了1件 + 追加3件 = 4件（初期データに依存）
    const expectedCount = initialActiveCount + 3;
    await expect(taskCount).toContainText(String(expectedCount)); // 【確認内容】: 初期+3件の未完了タスク数が表示されること
  });
});
