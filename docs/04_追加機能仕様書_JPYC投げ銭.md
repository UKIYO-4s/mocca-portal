# Moccaポータル 追加機能仕様書

**作成日:** 2025年12月30日  
**対象システム:** Moccaポータル  
**追加機能:** JPYC投げ銭システム + 利用者専用ページ

---

## 目次
1. [概要](#概要)
2. [システム全体フロー](#システム全体フロー)
3. [データベース設計](#データベース設計)
4. [機能詳細](#機能詳細)
5. [技術実装](#技術実装)
6. [セキュリティ・不正防止](#セキュリティ不正防止)
7. [実装スケジュール](#実装スケジュール)
8. [必要なリソース](#必要なリソース)
9. [運用・保守](#運用保守)
10. [PR戦略](#pr戦略)

---

## 概要

### 背景・目的
加計呂麻島という離島の特性とWeb3の新規性を組み合わせ、以下を実現する：
- スタッフへの直接的な感謝の仕組み
- 暗号資産JPYCを活用した先進的なサービス
- JPYC社長による拡散を通じた知名度向上
- シームレスなGoogleレビュー獲得
- スタッフのモチベーション向上と可視化

### 実装する機能
1. **GAS予約データ同期**（別途Phase Aで実装）
2. **利用者専用ページ（QRコード経由）**
3. **JPYC投げ銭システム（Polygon）**
4. **スタッフウォレット管理**
5. **投げ銭統計（管理画面）**
6. **Googleレビュー誘導**
7. **問い合わせ機能**

### 技術スタック
- **ブロックチェーン:** Polygon（低ガス代）
- **暗号資産:** JPYC（日本円ステーブルコイン）
- **Web3ライブラリ:** ethers.js v6
- **ウォレット:** MetaMask
- **QRコード生成:** SimpleSoftwareIO/simple-qrcode
- **RPCプロバイダー:** Infura or Alchemy

---

## システム全体フロー

### 1. チェックイン時
```
予約確定（管理者承認）
  ↓
QRコード自動生成
  ↓
チェックイン時にQRコード配布（印刷 or メール）
  ↓
お客様がスマホでスキャン
  ↓
利用者専用ページ表示
  - 宿泊情報
  - 担当スタッフ一覧
  - 各スタッフへの「チップを贈る」ボタン
  - Googleレビュー依頼
  - 問い合わせリンク
```

### 2. 投げ銭の流れ
```
お客様が「チップを贈る」ボタンをクリック
  ↓
MetaMask起動（ウォレット接続）
  ↓
JPYC 100円分の送金トランザクション作成
  ↓
お客様がトランザクション承認
  ↓
Polygonネットワークで送金実行（ガス代：数円）
  ↓
トランザクション完了
  ↓
Laravel側でトランザクションハッシュを記録
  ↓
投げ銭回数をデータベースに保存
  ↓
スタッフのウォレットにJPYC着金
```

### 3. 統計の確認（管理者）
```
管理画面にログイン
  ↓
投げ銭統計ページ
  - スタッフ別受取回数（今月/累計）
  - 最終受取日時
  - 月次グラフ
  ↓
※金額は一切表示しない（プライバシー保護）
```

### 4. チェックアウト後
```
利用者ページは有効期限内（30日間）アクセス可能
  ↓
追加で投げ銭やレビュー投稿が可能
  ↓
期限切れ後は自動的に無効化
```

---

## データベース設計

### 新規テーブル

#### 1. guest_pages（利用者ページ）
| カラム名 | 型 | 属性 | 説明 |
|---------|-----|------|------|
| id | bigint | PK, AUTO_INCREMENT | 主キー |
| uuid | char(36) | UNIQUE, NOT NULL | QRコード用ユニークID |
| reservation_id | bigint | FK, NULLABLE | 予約ID（banshirou/mocca） |
| reservation_type | enum | NULLABLE | 'banshirou', 'mocca' |
| guest_name | varchar(100) | NOT NULL | 宿泊者名 |
| room_number | varchar(20) | NULLABLE | 部屋番号 |
| check_in_date | date | NOT NULL | チェックイン日 |
| check_out_date | date | NOT NULL | チェックアウト日 |
| qr_code_path | varchar(255) | NULLABLE | QRコード画像パス |
| is_active | boolean | DEFAULT true | 有効フラグ |
| expires_at | timestamp | NULLABLE | 有効期限 |
| created_at | timestamp | NOT NULL | 作成日時 |
| updated_at | timestamp | NOT NULL | 更新日時 |

**インデックス:**
- `uuid` (UNIQUE)
- `reservation_id, reservation_type`
- `expires_at`

---

#### 2. guest_staff_assignments（お客様-スタッフ紐付け）
| カラム名 | 型 | 属性 | 説明 |
|---------|-----|------|------|
| id | bigint | PK, AUTO_INCREMENT | 主キー |
| guest_page_id | bigint | FK, NOT NULL | 利用者ページID |
| staff_id | bigint | FK, NOT NULL | スタッフID（users.id） |
| role | enum | NOT NULL | 'cooking', 'cleaning', 'front' |
| assigned_at | timestamp | NOT NULL | 割り当て日時 |

**インデックス:**
- `guest_page_id`
- `staff_id`
- `guest_page_id, staff_id` (UNIQUE)

**役割（role）の種類:**
- `cooking`: 調理担当
- `cleaning`: 清掃担当
- `front`: フロント担当

---

#### 3. staff_wallets（スタッフウォレット）
| カラム名 | 型 | 属性 | 説明 |
|---------|-----|------|------|
| id | bigint | PK, AUTO_INCREMENT | 主キー |
| user_id | bigint | FK, UNIQUE, NOT NULL | スタッフID（users.id） |
| wallet_address | varchar(42) | UNIQUE, NOT NULL | Polygonウォレットアドレス |
| is_verified | boolean | DEFAULT false | 検証済みフラグ |
| verification_tx_hash | varchar(66) | NULLABLE | 検証用トランザクションハッシュ |
| connected_at | timestamp | NOT NULL | 接続日時 |
| updated_at | timestamp | NOT NULL | 更新日時 |

**インデックス:**
- `user_id` (UNIQUE)
- `wallet_address` (UNIQUE)
- `is_verified`

---

#### 4. tip_transactions（投げ銭履歴）
| カラム名 | 型 | 属性 | 説明 |
|---------|-----|------|------|
| id | bigint | PK, AUTO_INCREMENT | 主キー |
| guest_page_id | bigint | FK, NOT NULL | 利用者ページID |
| staff_id | bigint | FK, NOT NULL | 受取スタッフID |
| transaction_hash | varchar(66) | UNIQUE, NOT NULL | トランザクションハッシュ |
| network | varchar(20) | DEFAULT 'polygon' | ネットワーク名 |
| tip_count | int | DEFAULT 1 | 固定値（1回=100円） |
| ip_address | varchar(45) | NULLABLE | 送信元IPアドレス |
| user_agent | text | NULLABLE | ユーザーエージェント |
| tipped_at | timestamp | NOT NULL | 投げ銭日時 |

**インデックス:**
- `guest_page_id`
- `staff_id`
- `transaction_hash` (UNIQUE)
- `tipped_at`
- `ip_address, staff_id, tipped_at`（不正防止用）

---

#### 5. google_review_requests（レビュー依頼履歴）
| カラム名 | 型 | 属性 | 説明 |
|---------|-----|------|------|
| id | bigint | PK, AUTO_INCREMENT | 主キー |
| guest_page_id | bigint | FK, NOT NULL | 利用者ページID |
| clicked_at | timestamp | NOT NULL | クリック日時 |
| ip_address | varchar(45) | NULLABLE | クリック元IP |
| review_submitted | boolean | DEFAULT false | レビュー投稿確認（手動更新） |
| submitted_at | timestamp | NULLABLE | 投稿日時 |

**インデックス:**
- `guest_page_id`
- `clicked_at`

---

### 既存テーブルへの追加

#### users テーブル（変更なし）
- スタッフの `role` を使用
- `staff_wallets` テーブルとリレーション

#### banshirou_reservations / mocca_reservations テーブル
- `guest_pages` テーブルとリレーション
- 既存の構造は変更なし

---

## 機能詳細

### 1. QRコード生成・管理

#### 1.1 QRコード自動生成
**トリガー:**
- 予約が承認（`status = '承認済み'`）されたとき

**処理内容:**
```php
// 予約承認時に自動実行
1. UUIDを生成（例: abc123-def456-ghi789）
2. guest_pages レコード作成
   - uuid: 生成したUUID
   - reservation_id: 予約ID
   - reservation_type: 'banshirou' or 'mocca'
   - guest_name: 予約者名
   - check_in_date: チェックイン日
   - check_out_date: チェックアウト日
   - expires_at: チェックアウト日 + 30日
3. QRコード画像生成
   - URL: https://mocca-portal.com/guest/{uuid}
   - サイズ: 300x300px
   - 保存先: storage/app/public/qrcodes/{uuid}.png
4. qr_code_path に保存パスを記録
```

#### 1.2 QRコード配布方法
**Option A: 印刷配布**
- 管理画面からQRコード画像をダウンロード
- A4用紙に印刷してチェックイン時に手渡し

**Option B: メール送付**
- チェックイン前日に自動メール送信
- QRコード画像を添付
- 利用方法を記載

**Option C: LINE送付**
- LINE Messaging API連携（将来的に）
- チェックイン時にLINEでQRコードを送信

#### 1.3 QRコード再発行
**ユースケース:**
- お客様がQRコードを紛失した場合
- メールが届かなかった場合

**処理:**
- 管理画面から予約を検索
- 「QRコード再発行」ボタンをクリック
- 新しいQRコード画像を生成（UUIDは同じ）
- メールまたは印刷で再配布

---

### 2. 利用者専用ページ

#### 2.1 ページ構成
**URL形式:**
```
https://mocca-portal.com/guest/{uuid}
```

**表示内容:**
```
┌─────────────────────────────────┐
│ 🏝️ ようこそ、◯◯様              │
│                                 │
│ ご滞在: 2025/01/10 - 2025/01/12 │
│ お部屋: 201号室                 │
├─────────────────────────────────┤
│ 👥 担当スタッフ                 │
│                                 │
│ [写真] 山田太郎さん             │
│ 役割: 調理担当                  │
│ [チップを贈る（100円）]         │
│                                 │
│ [写真] 佐藤花子さん             │
│ 役割: 清掃担当                  │
│ [チップを贈る（100円）]         │
│                                 │
│ [写真] 田中一郎さん             │
│ 役割: フロント担当              │
│ [チップを贈る（100円）]         │
├─────────────────────────────────┤
│ ⭐ ご滞在はいかがでしたか？     │
│                                 │
│ [Googleレビューを書く]          │
├─────────────────────────────────┤
│ 📞 お問い合わせ                 │
│                                 │
│ [LINEで問い合わせ]              │
│ [電話する: 0997-XX-XXXX]        │
└─────────────────────────────────┘
```

#### 2.2 アクセス制御
**有効期限:**
- チェックアウト日 + 30日まで
- 期限切れ後は「このページは無効です」と表示

**セキュリティ:**
- UUIDは推測不可能な形式
- ログイン不要（URLを知っていればアクセス可能）
- 個人情報は最小限（名前、滞在日程のみ）

#### 2.3 スマホ最適化
- レスポンシブデザイン
- タップしやすいボタンサイズ（最小44px）
- スクロール不要な画面設計
- フォントサイズ: 最小16px

---

### 3. JPYC投げ銭システム

#### 3.1 投げ銭の仕様
**金額:** 固定100円（100 JPYC）  
**ガス代:** お客様負担（Polygonで数円）  
**制限:** 同一スタッフへ24時間に最大5回  
**トランザクション:** Polygon Mainnet上で実行  

#### 3.2 投げ銭の流れ（詳細）

**Step 1: ボタンクリック**
```javascript
// お客様が「チップを贈る」ボタンをクリック
1. MetaMaskインストール確認
2. ウォレット接続要求
3. ネットワーク確認（Polygon Mainnetか？）
4. JPYC残高確認（100 JPYC以上あるか？）
```

**Step 2: トランザクション作成**
```javascript
// ethers.jsでトランザクション作成
1. JPYCコントラクトのインスタンス化
   - アドレス: 0x6AE7Dfc73E0dDE2aa99ac063DcF7e8A63265108c（Polygon）
   - ABI: ERC20標準
2. transfer関数を呼び出し
   - to: スタッフのウォレットアドレス
   - amount: 100000000000000000000（100 JPYC、18桁）
3. MetaMaskでガス代見積もり表示
```

**Step 3: トランザクション送信**
```javascript
// お客様がMetaMaskで承認
1. トランザクション署名
2. Polygonネットワークへブロードキャスト
3. トランザクションハッシュ取得
4. 承認待機（通常5-10秒）
```

**Step 4: 完了処理**
```javascript
// トランザクション確認後
1. Laravel APIへPOSTリクエスト
   - guest_page_id
   - staff_id
   - transaction_hash
2. データベースに記録
3. 成功メッセージ表示
```

#### 3.3 エラーハンドリング

**エラーケース1: MetaMaskがインストールされていない**
```
表示: 「MetaMaskアプリをインストールしてください」
対応: App StoreまたはGoogle Playへのリンク表示
```

**エラーケース2: Polygonネットワークに接続していない**
```
表示: 「Polygonネットワークに切り替えてください」
対応: 自動的にネットワーク切り替えを提案
```

**エラーケース3: JPYC残高不足**
```
表示: 「JPYC残高が不足しています（最低100 JPYC必要）」
対応: JPYCの購入方法を案内
```

**エラーケース4: ガス代不足**
```
表示: 「MATIC残高が不足しています（ガス代が必要です）」
対応: MATICの入手方法を案内
```

**エラーケース5: トランザクション失敗**
```
表示: 「送金に失敗しました。時間をおいて再度お試しください」
対応: エラーログをLaravel側に記録
```

**エラーケース6: 24時間制限に達した**
```
表示: 「このスタッフへの投げ銭は24時間以内に5回まで可能です」
対応: 制限リセットまでの残り時間を表示
```

---

### 4. スタッフウォレット管理

#### 4.1 ウォレット登録（スタッフ側）
**アクセス先:** `/profile/wallet`

**登録手順:**
```
1. MetaMaskを接続
2. 現在接続しているウォレットアドレスを自動取得
3. 「このウォレットを登録する」ボタンをクリック
4. 検証用トランザクション送信（0.01 JPYC）
5. トランザクション確認後、ウォレット登録完了
```

**検証プロセス:**
- スタッフのウォレットアドレスが正しいか確認
- 実際に送金できるアドレスか検証
- 検証用トランザクションハッシュを記録

#### 4.2 ウォレット変更
**ユースケース:**
- ウォレットを紛失した場合
- 別のウォレットに変更したい場合

**手順:**
```
1. プロフィール画面で「ウォレットを変更」をクリック
2. 新しいウォレットで再度登録手順を実施
3. 旧ウォレットアドレスは履歴として保存
```

#### 4.3 管理者による確認
**管理画面: `/admin/staff-wallets`**

**表示内容:**
- スタッフ一覧
- ウォレットアドレス（登録済み/未登録）
- 検証状態（verified/pending）
- 登録日時
- 今月の受取回数

**機能:**
- 未登録スタッフへのリマインド送信
- ウォレット検証の手動再実行

---

### 5. 投げ銭統計（管理画面）

#### 5.1 統計ダッシュボード
**アクセス先:** `/admin/tips`

**表示内容:**

**① スタッフ別集計テーブル**
| スタッフ名 | 今月の受取回数 | 累計受取回数 | 最終受取日 |
|-----------|---------------|-------------|-----------|
| 山田太郎 | 15回 | 48回 | 2025/01/29 14:23 |
| 佐藤花子 | 12回 | 35回 | 2025/01/28 19:45 |
| 田中一郎 | 8回 | 22回 | 2025/01/27 11:10 |

**② 月次推移グラフ**
- 横軸: 月（2024/10 ~ 2025/01）
- 縦軸: 受取回数
- 各スタッフの推移を折れ線グラフで表示

**③ 役割別集計**
| 役割 | 今月の受取回数 | 平均受取回数/人 |
|------|---------------|----------------|
| 調理担当 | 45回 | 15回 |
| 清掃担当 | 38回 | 12.7回 |
| フロント担当 | 24回 | 8回 |

**④ 時間帯別分析**
- 投げ銭が多い時間帯
- チェックアウト後の投げ銭率

#### 5.2 個別スタッフ詳細
**アクセス先:** `/admin/tips/staff/{user}`

**表示内容:**
- 月別受取回数グラフ（過去12ヶ月）
- 役割ごとの受取傾向
- 最近の受取履歴（日時のみ、金額は非表示）

#### 5.3 エクスポート機能
- CSV出力（スタッフ名、受取回数、日時）
- 給与査定や評価の参考資料として活用

#### 5.4 プライバシー保護
**表示しない情報:**
- ❌ 投げ銭の金額（固定100円なので不要）
- ❌ 誰が投げ銭したか（お客様情報）
- ❌ トランザクションハッシュ（管理者には不要）

**表示する情報:**
- ✅ 受取回数
- ✅ 受取日時
- ✅ 役割別・月別の集計

---

### 6. Googleレビュー誘導

#### 6.1 レビューボタン
**配置場所:**
- 利用者専用ページの中段
- スタッフカードの下

**デザイン:**
```
┌─────────────────────────────────┐
│ ⭐ ご滞在はいかがでしたか？      │
│                                 │
│ お客様の声が私たちの励みになります│
│                                 │
│ [Googleレビューを書く]          │
│                                 │
│ ※ レビューを書くとGoogle Mapsに │
│   自動的に投稿されます          │
└─────────────────────────────────┘
```

#### 6.2 遷移先
**URL形式:**
```
https://search.google.com/local/writereview?placeid={PLACE_ID}
```

**PLACE_ID取得方法:**
1. Google Mapsで施設を検索
2. URLから `placeid=` の値をコピー
3. `.env` に設定
```env
GOOGLE_PLACE_ID_BANSHIROU=ChIJ...（ばんしろう）
GOOGLE_PLACE_ID_MOCCA=ChIJ...（もっか）
```

#### 6.3 クリック記録
**目的:**
- レビュー依頼の効果測定
- どのお客様がレビューページにアクセスしたか把握

**記録内容:**
- `guest_page_id`
- クリック日時
- IPアドレス（不正防止）

#### 6.4 レビュー投稿確認
**手動更新:**
- 管理者がGoogle Mapsを定期チェック
- 新しいレビューがあれば `review_submitted = true` に更新
- 将来的にはGoogle My Business APIで自動化も検討

---

### 7. 問い合わせ機能

#### 7.1 問い合わせ方法
**Option A: LINE連携**
- LINE公式アカウントへのリンク
- タップで自動的にLINEアプリが起動
- メッセージテンプレート自動挿入
```
「◯◯です（予約番号: 12345）。お問い合わせ内容...」
```

**Option B: 電話**
- `tel:` スキームで電話アプリを起動
- 営業時間外は留守番電話案内

**Option C: メール（将来的に）**
- ポータル内のメッセージシステム
- スタッフへの直接メッセージ機能

#### 7.2 問い合わせボタンのデザイン
```
┌─────────────────────────────────┐
│ 📞 お問い合わせ                 │
│                                 │
│ [💬 LINEで問い合わせ]           │
│                                 │
│ [📞 電話する]                   │
│ 0997-XX-XXXX                    │
│ 営業時間: 9:00-18:00            │
└─────────────────────────────────┘
```

---

## 技術実装

### 1. バックエンド（Laravel）

#### 1.1 ルート定義
```php
// routes/web.php

// 利用者専用ページ（認証不要）
Route::get('/guest/{uuid}', [GuestPageController::class, 'show'])
    ->name('guest.page');

// API（CORS許可）
Route::prefix('api')->group(function () {
    // 投げ銭記録
    Route::post('/tip/record', [TipController::class, 'record']);
    
    // レビュークリック記録
    Route::post('/review/clicked', [ReviewController::class, 'recordClick']);
});

// スタッフ用（認証必須）
Route::middleware(['auth', 'role:staff,manager,admin'])->group(function () {
    Route::get('/profile/wallet', [StaffWalletController::class, 'edit']);
    Route::post('/profile/wallet', [StaffWalletController::class, 'update']);
});

// 管理者用（認証必須）
Route::middleware(['auth', 'role:admin'])->group(function () {
    // 投げ銭統計
    Route::get('/admin/tips', [TipStatisticsController::class, 'index'])->name('admin.tips.index');
    Route::get('/admin/tips/staff/{user}', [TipStatisticsController::class, 'show'])->name('admin.tips.show');
    Route::get('/admin/tips/export', [TipStatisticsController::class, 'export'])->name('admin.tips.export');

    // スタッフウォレット管理
    Route::get('/admin/staff-wallets', [StaffWalletController::class, 'adminIndex'])->name('admin.staff-wallets');
});
```

#### 1.2 コントローラー

**GuestPageController.php**
```php
<?php

namespace App\Http\Controllers;

use App\Models\GuestPage;
use Inertia\Inertia;

class GuestPageController extends Controller
{
    public function show($uuid)
    {
        $guestPage = GuestPage::with(['staffAssignments.staff.wallet'])
            ->where('uuid', $uuid)
            ->where('is_active', true)
            ->where('expires_at', '>', now())
            ->firstOrFail();
        
        return Inertia::render('Guest/Show', [
            'guestData' => $guestPage,
            'staffList' => $guestPage->staffAssignments->map(function ($assignment) {
                return [
                    'id' => $assignment->staff->id,
                    'name' => $assignment->staff->name,
                    'role' => $assignment->role,
                    'avatar' => $assignment->staff->avatar,
                    'wallet_address' => $assignment->staff->wallet?->wallet_address,
                ];
            }),
            'googlePlaceId' => config('services.google.place_id_banshirou'),
        ]);
    }
}
```

**TipController.php**
```php
<?php

namespace App\Http\Controllers;

use App\Models\TipTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TipController extends Controller
{
    public function record(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'guest_page_id' => 'required|exists:guest_pages,id',
            'staff_id' => 'required|exists:users,id',
            'transaction_hash' => 'required|string|size:66|unique:tip_transactions,transaction_hash',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // 24時間制限チェック
        $recentTips = TipTransaction::where('guest_page_id', $request->guest_page_id)
            ->where('staff_id', $request->staff_id)
            ->where('ip_address', $request->ip())
            ->where('tipped_at', '>=', now()->subHours(24))
            ->count();
        
        if ($recentTips >= 5) {
            return response()->json([
                'error' => '24時間以内の制限（5回）に達しました'
            ], 429);
        }
        
        // トランザクション記録
        $tip = TipTransaction::create([
            'guest_page_id' => $request->guest_page_id,
            'staff_id' => $request->staff_id,
            'transaction_hash' => $request->transaction_hash,
            'network' => 'polygon',
            'tip_count' => 1,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'tipped_at' => now(),
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'チップを記録しました',
            'tip' => $tip,
        ]);
    }
}
```

**TipStatisticsController.php**
```php
<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\TipTransaction;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class TipStatisticsController extends Controller
{
    public function index()
    {
        $stats = User::where('role', 'staff')
            ->with('wallet')
            ->get()
            ->map(function ($staff) {
                return [
                    'id' => $staff->id,
                    'name' => $staff->name,
                    'avatar' => $staff->avatar,
                    'wallet_connected' => $staff->wallet !== null,
                    'tips_this_month' => $staff->tipTransactions()
                        ->whereMonth('tipped_at', now()->month)
                        ->count(),
                    'tips_total' => $staff->tipTransactions()->count(),
                    'last_tipped_at' => $staff->tipTransactions()
                        ->latest('tipped_at')
                        ->value('tipped_at'),
                ];
            });
        
        // 月次集計
        $monthly = TipTransaction::select(
                DB::raw('DATE_FORMAT(tipped_at, "%Y-%m") as month'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();
        
        return Inertia::render('Admin/TipStatistics', [
            'stats' => $stats,
            'monthly' => $monthly,
        ]);
    }
    
    public function show($id)
    {
        $staff = User::findOrFail($id);
        
        $tips = $staff->tipTransactions()
            ->with('guestPage')
            ->latest('tipped_at')
            ->paginate(50);
        
        $monthlyTips = $staff->tipTransactions()
            ->select(
                DB::raw('DATE_FORMAT(tipped_at, "%Y-%m") as month'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('month')
            ->orderBy('month', 'desc')
            ->limit(12)
            ->get();
        
        return Inertia::render('Admin/StaffTipDetail', [
            'staff' => $staff,
            'tips' => $tips,
            'monthlyTips' => $monthlyTips,
        ]);
    }
}
```

#### 1.3 モデル定義

**GuestPage.php**
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuestPage extends Model
{
    protected $fillable = [
        'uuid',
        'reservation_id',
        'reservation_type',
        'guest_name',
        'room_number',
        'check_in_date',
        'check_out_date',
        'qr_code_path',
        'is_active',
        'expires_at',
    ];
    
    protected $casts = [
        'check_in_date' => 'date',
        'check_out_date' => 'date',
        'is_active' => 'boolean',
        'expires_at' => 'datetime',
    ];
    
    public function staffAssignments(): HasMany
    {
        return $this->hasMany(GuestStaffAssignment::class);
    }
    
    public function reservation(): BelongsTo
    {
        return $this->reservation_type === 'banshirou'
            ? $this->belongsTo(BanshirouReservation::class, 'reservation_id')
            : $this->belongsTo(MoccaReservation::class, 'reservation_id');
    }
    
    public function tipTransactions(): HasMany
    {
        return $this->hasMany(TipTransaction::class);
    }
    
    public function isExpired(): bool
    {
        return $this->expires_at < now() || !$this->is_active;
    }
}
```

**StaffWallet.php**
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffWallet extends Model
{
    protected $fillable = [
        'user_id',
        'wallet_address',
        'is_verified',
        'verification_tx_hash',
        'connected_at',
    ];
    
    protected $casts = [
        'is_verified' => 'boolean',
        'connected_at' => 'datetime',
    ];
    
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

**TipTransaction.php**
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TipTransaction extends Model
{
    protected $fillable = [
        'guest_page_id',
        'staff_id',
        'transaction_hash',
        'network',
        'tip_count',
        'ip_address',
        'user_agent',
        'tipped_at',
    ];
    
    protected $casts = [
        'tip_count' => 'integer',
        'tipped_at' => 'datetime',
    ];
    
    public $timestamps = false;
    
    public function guestPage(): BelongsTo
    {
        return $this->belongsTo(GuestPage::class);
    }
    
    public function staff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'staff_id');
    }
}
```

**Userモデルへの追加**
```php
// User.php に追加

public function wallet(): HasOne
{
    return $this->hasOne(StaffWallet::class);
}

public function tipTransactions(): HasMany
{
    return $this->hasMany(TipTransaction::class, 'staff_id');
}
```

#### 1.4 QRコード生成サービス

**QrCodeService.php**
```php
<?php

namespace App\Services;

use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Storage;

class QrCodeService
{
    public function generate(string $uuid, string $url): string
    {
        $filename = "{$uuid}.png";
        $path = "qrcodes/{$filename}";
        
        $qrCode = QrCode::format('png')
            ->size(300)
            ->margin(2)
            ->generate($url);
        
        Storage::disk('public')->put($path, $qrCode);
        
        return $path;
    }
    
    public function regenerate(string $uuid, string $url): string
    {
        // 既存のQRコードを削除
        $oldPath = "qrcodes/{$uuid}.png";
        if (Storage::disk('public')->exists($oldPath)) {
            Storage::disk('public')->delete($oldPath);
        }
        
        return $this->generate($uuid, $url);
    }
}
```

#### 1.5 予約承認時の自動処理

**BanshirouReservationController.php（更新）**
```php
use App\Services\QrCodeService;
use Illuminate\Support\Str;

public function approve($id, QrCodeService $qrCodeService)
{
    $reservation = BanshirouReservation::findOrFail($id);
    $reservation->update(['status' => '承認済み']);
    
    // GuestPage作成
    $uuid = Str::uuid();
    $url = route('guest.page', ['uuid' => $uuid]);
    $qrCodePath = $qrCodeService->generate($uuid, $url);
    
    $guestPage = GuestPage::create([
        'uuid' => $uuid,
        'reservation_id' => $reservation->id,
        'reservation_type' => 'banshirou',
        'guest_name' => $reservation->guest_name,
        'room_number' => $reservation->room_number,
        'check_in_date' => $reservation->check_in_date,
        'check_out_date' => $reservation->check_out_date,
        'qr_code_path' => $qrCodePath,
        'expires_at' => $reservation->check_out_date->addDays(30),
    ]);
    
    // デフォルトスタッフ割り当て（手動で変更可能）
    // ここでは省略、管理画面で設定
    
    return redirect()->back()->with('success', '予約を承認しました');
}
```

---

### 2. フロントエンド（React + TypeScript）

#### 2.1 利用者ページコンポーネント

**GuestShow.tsx**
```tsx
// resources/js/Pages/Guest/Show.tsx

import React from 'react';
import { Head } from '@inertiajs/react';
import StaffCard from '@/Components/Guest/StaffCard';
import GoogleReviewButton from '@/Components/Guest/GoogleReviewButton';
import ContactButtons from '@/Components/Guest/ContactButtons';

interface Staff {
    id: number;
    name: string;
    role: 'cooking' | 'cleaning' | 'front';
    avatar: string | null;
    wallet_address: string | null;
}

interface GuestData {
    id: number;
    uuid: string;
    guest_name: string;
    room_number: string | null;
    check_in_date: string;
    check_out_date: string;
}

interface Props {
    guestData: GuestData;
    staffList: Staff[];
    googlePlaceId: string;
}

export default function GuestShow({ guestData, staffList, googlePlaceId }: Props) {
    return (
        <>
            <Head title={`ようこそ、${guestData.guest_name}様`} />
            
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
                <div className="max-w-2xl mx-auto px-4 py-8">
                    {/* ヘッダー */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            🏝️ ようこそ、{guestData.guest_name}様
                        </h1>
                        <p className="text-gray-600">
                            ご滞在: {guestData.check_in_date} 〜 {guestData.check_out_date}
                        </p>
                        {guestData.room_number && (
                            <p className="text-gray-600">
                                お部屋: {guestData.room_number}
                            </p>
                        )}
                    </div>
                    
                    {/* スタッフ一覧 */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            👥 担当スタッフ
                        </h2>
                        <div className="space-y-4">
                            {staffList.map(staff => (
                                <StaffCard
                                    key={staff.id}
                                    staff={staff}
                                    guestPageId={guestData.id}
                                />
                            ))}
                        </div>
                    </section>
                    
                    {/* Googleレビュー */}
                    <section className="mb-8">
                        <GoogleReviewButton
                            guestPageId={guestData.id}
                            placeId={googlePlaceId}
                        />
                    </section>
                    
                    {/* 問い合わせ */}
                    <section>
                        <ContactButtons />
                    </section>
                </div>
            </div>
        </>
    );
}
```

**StaffCard.tsx**
```tsx
// resources/js/Components/Guest/StaffCard.tsx

import React, { useState } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';

interface Staff {
    id: number;
    name: string;
    role: 'cooking' | 'cleaning' | 'front';
    avatar: string | null;
    wallet_address: string | null;
}

interface Props {
    staff: Staff;
    guestPageId: number;
}

const JPYC_CONTRACT_ADDRESS = '0x6AE7Dfc73E0dDE2aa99ac063DcF7e8A63265108c';
const TIP_AMOUNT = '100';

const roleLabels = {
    cooking: '調理担当',
    cleaning: '清掃担当',
    front: 'フロント担当',
};

export default function StaffCard({ staff, guestPageId }: Props) {
    const [isSending, setIsSending] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const sendTip = async () => {
        try {
            setIsSending(true);
            setError(null);
            
            // MetaMaskインストール確認
            if (!window.ethereum) {
                setError('MetaMaskをインストールしてください');
                window.open('https://metamask.io/download/', '_blank');
                return;
            }
            
            const provider = new ethers.BrowserProvider(window.ethereum);
            
            // ウォレット接続
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            
            // ネットワーク確認
            const network = await provider.getNetwork();
            if (network.chainId !== 137n) { // Polygon Mainnet
                setError('Polygonネットワークに切り替えてください');
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x89' }], // 137 in hex
                });
                return;
            }
            
            // JPYCコントラクト
            const jpycContract = new ethers.Contract(
                JPYC_CONTRACT_ADDRESS,
                ['function transfer(address to, uint256 amount) returns (bool)'],
                signer
            );
            
            // 100 JPYC送金
            const amount = ethers.parseUnits(TIP_AMOUNT, 18);
            const tx = await jpycContract.transfer(staff.wallet_address, amount);
            
            // トランザクション待機
            await tx.wait();
            setTxHash(tx.hash);
            
            // Laravel側に記録
            await axios.post('/api/tip/record', {
                guest_page_id: guestPageId,
                staff_id: staff.id,
                transaction_hash: tx.hash,
            });
            
            alert('チップを贈りました！ありがとうございます🎉');
            
        } catch (err: any) {
            console.error(err);
            
            if (err.code === 'INSUFFICIENT_FUNDS') {
                setError('JPYC残高が不足しています（最低100 JPYC必要）');
            } else if (err.code === 4001) {
                setError('トランザクションをキャンセルしました');
            } else if (err.response?.status === 429) {
                setError(err.response.data.error);
            } else {
                setError('送金に失敗しました。時間をおいて再度お試しください');
            }
        } finally {
            setIsSending(false);
        }
    };
    
    if (!staff.wallet_address) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center space-x-4">
                    <img
                        src={staff.avatar || '/images/default-avatar.png'}
                        alt={staff.name}
                        className="w-16 h-16 rounded-full"
                    />
                    <div>
                        <h3 className="text-lg font-bold">{staff.name}さん</h3>
                        <p className="text-gray-600">{roleLabels[staff.role]}</p>
                        <p className="text-sm text-gray-500 mt-2">
                            ※ このスタッフはまだウォレットを設定していません
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-4 mb-4">
                <img
                    src={staff.avatar || '/images/default-avatar.png'}
                    alt={staff.name}
                    className="w-16 h-16 rounded-full"
                />
                <div>
                    <h3 className="text-lg font-bold">{staff.name}さん</h3>
                    <p className="text-gray-600">{roleLabels[staff.role]}</p>
                </div>
            </div>
            
            {txHash ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium mb-2">
                        ✅ チップを贈りました！
                    </p>
                    <a
                        href={`https://polygonscan.com/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                    >
                        トランザクションを確認
                    </a>
                </div>
            ) : (
                <>
                    <button
                        onClick={sendTip}
                        disabled={isSending}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isSending ? '送信中...' : 'チップを贈る（100円）'}
                    </button>
                    
                    {error && (
                        <p className="text-red-600 text-sm mt-2">{error}</p>
                    )}
                </>
            )}
        </div>
    );
}
```

**GoogleReviewButton.tsx**
```tsx
// resources/js/Components/Guest/GoogleReviewButton.tsx

import React from 'react';
import axios from 'axios';

interface Props {
    guestPageId: number;
    placeId: string;
}

export default function GoogleReviewButton({ guestPageId, placeId }: Props) {
    const handleClick = async () => {
        // クリック記録
        try {
            await axios.post('/api/review/clicked', {
                guest_page_id: guestPageId,
            });
        } catch (err) {
            console.error('Failed to record review click:', err);
        }
        
        // Googleレビューページへ遷移
        const reviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
        window.open(reviewUrl, '_blank');
    };
    
    return (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                ⭐ ご滞在はいかがでしたか？
            </h2>
            <p className="text-gray-600 mb-4">
                お客様の声が私たちの励みになります
            </p>
            <button
                onClick={handleClick}
                className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors"
            >
                Googleレビューを書く
            </button>
            <p className="text-sm text-gray-500 mt-3">
                ※ レビューを書くとGoogle Mapsに自動的に投稿されます
            </p>
        </div>
    );
}
```

**ContactButtons.tsx**
```tsx
// resources/js/Components/Guest/ContactButtons.tsx

import React from 'react';

export default function ContactButtons() {
    const lineUrl = 'https://line.me/R/ti/p/@YOUR_LINE_ID';
    const phoneNumber = '0997-XX-XXXX';
    
    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                📞 お問い合わせ
            </h2>
            <div className="space-y-3">
                <a
                    href={lineUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition-colors text-center"
                >
                    💬 LINEで問い合わせ
                </a>
                <a
                    href={`tel:${phoneNumber}`}
                    className="block w-full bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors text-center"
                >
                    📞 電話する
                </a>
                <p className="text-sm text-gray-600 text-center">
                    {phoneNumber}<br />
                    営業時間: 9:00-18:00
                </p>
            </div>
        </div>
    );
}
```

#### 2.2 管理画面コンポーネント

**TipStatistics.tsx**
```tsx
// resources/js/Pages/Admin/TipStatistics.tsx

import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Line } from 'react-chartjs-2';

interface Staff {
    id: number;
    name: string;
    avatar: string | null;
    wallet_connected: boolean;
    tips_this_month: number;
    tips_total: number;
    last_tipped_at: string | null;
}

interface MonthlyData {
    month: string;
    count: number;
}

interface Props {
    stats: Staff[];
    monthly: MonthlyData[];
}

export default function TipStatistics({ stats, monthly }: Props) {
    const chartData = {
        labels: monthly.map(m => m.month),
        datasets: [{
            label: '月次受取回数',
            data: monthly.map(m => m.count),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
        }],
    };
    
    return (
        <AuthenticatedLayout>
            <Head title="投げ銭統計" />
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold mb-6">投げ銭統計</h1>
                    
                    {/* スタッフ別集計テーブル */}
                    <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        スタッフ名
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        今月の受取回数
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        累計受取回数
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        最終受取日
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {stats.map(staff => (
                                    <tr key={staff.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <img
                                                    src={staff.avatar || '/images/default-avatar.png'}
                                                    alt={staff.name}
                                                    className="w-10 h-10 rounded-full mr-3"
                                                />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {staff.name}
                                                    </div>
                                                    {!staff.wallet_connected && (
                                                        <div className="text-xs text-red-600">
                                                            ウォレット未設定
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {staff.tips_this_month}回
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {staff.tips_total}回
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {staff.last_tipped_at || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* 月次グラフ */}
                    <div className="bg-white shadow-md rounded-lg p-6">
                        <h2 className="text-xl font-bold mb-4">月次推移</h2>
                        <Line data={chartData} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
```

---

### 3. 環境変数設定

**.env（追加項目）**
```env
# Google Places API
GOOGLE_PLACE_ID_BANSHIROU=ChIJ...
GOOGLE_PLACE_ID_MOCCA=ChIJ...

# Polygon RPC（Infura or Alchemy）
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID

# JPYC Contract Address（Polygon Mainnet）
JPYC_CONTRACT_ADDRESS=0x6AE7Dfc73E0dDE2aa99ac063DcF7e8A63265108c

# LINE公式アカウント
LINE_OFFICIAL_ID=@YOUR_LINE_ID
LINE_OFFICIAL_URL=https://line.me/R/ti/p/@YOUR_LINE_ID

# 電話番号
CONTACT_PHONE_NUMBER=0997-XX-XXXX
```

---

### 4. 必要なパッケージ

**Composer（Laravel）**
```bash
composer require simplesoftwareio/simple-qrcode
```

**NPM（React）**
```bash
npm install ethers@6
npm install chart.js react-chartjs-2
```

---

## セキュリティ・不正防止

### 1. 投げ銭の不正防止

#### 1.1 24時間制限
- 同一IPアドレスから同一スタッフへの投げ銭を24時間に5回まで制限
- データベースの `ip_address` カラムで管理

#### 1.2 トランザクションハッシュの一意性
- `transaction_hash` カラムにUNIQUE制約
- 同じトランザクションを複数回記録できないようにする
- リプレイアタック防止

#### 1.3 ウォレットアドレスの検証
- スタッフがウォレットを登録する際、少額（0.01 JPYC）の検証用送金を実施
- トランザクションが成功した場合のみ `is_verified = true` に設定

### 2. QRコードのセキュリティ

#### 2.1 UUIDの推測不可能性
- `Str::uuid()` で生成されるUUIDはランダム
- 推測攻撃に対して安全

#### 2.2 有効期限
- チェックアウト日 + 30日で自動無効化
- `expires_at` と `is_active` フラグで管理

#### 2.3 情報の最小化
- 利用者ページには個人情報を最小限しか表示しない
- クレジットカード情報や住所は表示しない

### 3. プライバシー保護

#### 3.1 金額の非表示
- データベースに金額を保存しない
- `tip_count` は回数のみ（固定100円/回）
- スタッフのプライバシーを保護

#### 3.2 投げ銭元の匿名化
- 誰が投げ銭したかは記録しない
- `guest_page_id` のみで紐付け

#### 3.3 アクセスログ
- `ip_address` と `user_agent` を記録
- 不正行為の調査時のみ使用

---

## 実装スケジュール

### Phase A: 基盤整備（3-5日）

**Day 1-2: データベース設計**
- [ ] マイグレーションファイル作成
  - `guest_pages`
  - `guest_staff_assignments`
  - `staff_wallets`
  - `tip_transactions`
  - `google_review_requests`
- [ ] モデル作成
  - `GuestPage.php`
  - `GuestStaffAssignment.php`
  - `StaffWallet.php`
  - `TipTransaction.php`
  - `GoogleReviewRequest.php`
- [ ] リレーション定義
- [ ] マイグレーション実行・確認

**Day 3-4: スタッフウォレット管理**
- [ ] `StaffWalletController` 作成
- [ ] スタッフプロフィール画面にウォレット登録フォーム追加
- [ ] ウォレット検証機能実装
- [ ] 管理画面でスタッフウォレット一覧表示

**Day 5: QRコードサービス**
- [ ] `QrCodeService` 作成
- [ ] QRコード生成機能実装
- [ ] 予約承認時の自動QRコード生成
- [ ] 管理画面でQRコード再発行機能

---

### Phase B: 利用者ページ（2-3日）

**Day 6-7: ページ作成**
- [ ] `GuestPageController` 作成
- [ ] ルート定義（`/guest/{uuid}`）
- [ ] `GuestShow.tsx` コンポーネント作成
- [ ] スタッフ-予約の紐付け機能（管理画面）

**Day 8: UI実装**
- [ ] `StaffCard` コンポーネント作成
- [ ] レスポンシブデザイン調整
- [ ] 有効期限切れ画面作成

---

### Phase C: Web3投げ銭（5-7日）

**Day 9-10: ethers.js セットアップ**
- [ ] ethers.js インストール・設定
- [ ] MetaMask接続機能実装
- [ ] Polygonネットワーク切り替え機能

**Day 11-13: 投げ銭機能実装**
- [ ] JPYCコントラクト連携
- [ ] `TipController` 作成
- [ ] トランザクション送信機能
- [ ] エラーハンドリング実装

**Day 14-15: テスト**
- [ ] Polygon Mumbai（テストネット）でテスト
- [ ] 不正防止機能のテスト
- [ ] エラーケースのテスト

---

### Phase D: 統計・レビュー（2-3日）

**Day 16-17: 管理画面**
- [ ] `TipStatisticsController` 作成
- [ ] 統計ダッシュボード実装
- [ ] 月次グラフ実装
- [ ] CSV出力機能

**Day 18: レビュー・問い合わせ**
- [ ] `GoogleReviewButton` コンポーネント作成
- [ ] `ContactButtons` コンポーネント作成
- [ ] `ReviewController` 作成（クリック記録）

---

### Phase E: 本番デプロイ・調整（3-5日）

**Day 19-20: 本番環境準備**
- [ ] Polygon Mainnetへの切り替え
- [ ] 環境変数設定
- [ ] Google Place ID取得・設定
- [ ] LINE公式アカウント連携

**Day 21-22: ドキュメント作成**
- [ ] スタッフ向けウォレット作成マニュアル
- [ ] お客様向けMetaMask使い方ガイド
- [ ] トラブルシューティングガイド

**Day 23: 最終テスト・リリース**
- [ ] 本番環境での動作確認
- [ ] 少額での実送金テスト
- [ ] リリース

---

**合計: 約23営業日（4-5週間）**

---

## 必要なリソース

### 1. 技術リソース

#### Polygon RPC プロバイダー
**推奨: Infura or Alchemy**
- 無料プラン: 100,000リクエスト/日
- 有料プラン: $49/月〜（必要に応じて）
- 登録URL: https://www.infura.io/ or https://www.alchemy.com/

#### Google Places API
- Google Cloud Platformでプロジェクト作成
- Places API有効化
- APIキー取得
- コスト: 基本的に無料（月間クエリ数が少ない場合）

#### JPYC Contract Address
- Polygon Mainnet: `0x6AE7Dfc73E0dDE2aa99ac063DcF7e8A63265108c`
- 公式ドキュメント: https://jpyc.jp/

---

### 2. 人的リソース

#### スタッフトレーニング
- ウォレット作成方法
- QRコード配布方法
- トラブル対応

#### お客様サポート
- MetaMaskの使い方ガイド
- よくある質問（FAQ）
- 問い合わせ対応フロー

---

### 3. 運用リソース

#### 初期投資
- スタッフウォレット検証用JPYC: 約10 JPYC × スタッフ数
- テスト用JPYC: 100-500 JPYC
- テスト用MATIC（ガス代）: 10-50 MATIC

#### 月次コスト
- Infura/Alchemy: $0-49/月
- QRコード印刷: 約1,000円/月
- その他: ほぼ無料

---

## 運用・保守

### 1. 日次業務

#### スタッフ（フロント担当）
- チェックイン時のQRコード配布
- お客様からの問い合わせ対応
- QRコード紛失時の再発行

#### 管理者
- 投げ銭統計の確認（毎朝）
- Googleレビューの確認
- 問題報告の確認

---

### 2. 週次業務

#### 管理者
- 週次レポート作成
  - 投げ銭回数の推移
  - スタッフ別統計
  - レビュー獲得状況
- ウォレット未登録スタッフへのリマインド

---

### 3. 月次業務

#### 管理者
- 月次統計の確認・分析
- スタッフ評価への反映
- トラブル事例の振り返り

#### システム管理者
- データベースバックアップ確認
- ログの確認
- パフォーマンスチェック

---

### 4. トラブルシューティング

#### ケース1: お客様が投げ銭できない
**原因:**
- MetaMaskがインストールされていない
- Polygonネットワークに接続していない
- JPYC残高不足
- ガス代（MATIC）不足

**対応:**
1. 画面上のエラーメッセージを確認
2. 各ガイドに従って対応を依頼
3. 解決しない場合はスタッフが代理で受け取る（後日返金）

#### ケース2: トランザクションが失敗する
**原因:**
- ガス代不足
- ネットワーク混雑
- スタッフのウォレットアドレス誤り

**対応:**
1. トランザクションハッシュをPolygonscanで確認
2. エラー内容を特定
3. 必要に応じてスタッフのウォレット再登録

#### ケース3: QRコードが読み取れない
**原因:**
- 印刷が不鮮明
- QRコードが破損
- カメラの不具合

**対応:**
1. 管理画面からQRコードを再発行
2. メールまたはLINEでQRコードを送信
3. 直接URLを案内

---

### 5. データバックアップ

**バックアップ対象:**
- `guest_pages` テーブル
- `tip_transactions` テーブル
- `staff_wallets` テーブル
- QRコード画像ファイル

**バックアップ頻度:**
- 日次: 自動バックアップ（mysqldump）
- 週次: オフサイトバックアップ
- 月次: 長期保存用バックアップ

**保管期間:**
- 日次バックアップ: 7日間
- 週次バックアップ: 4週間
- 月次バックアップ: 1年間

---

### 6. セキュリティ対策

**定期的な確認事項:**
- [ ] 不正な投げ銭記録がないか
- [ ] 同一IPからの連続投げ銭がないか
- [ ] 無効なトランザクションハッシュがないか
- [ ] ウォレットアドレスの変更履歴

**アクセス制限:**
- 管理画面は社内IPからのみアクセス可能（推奨）
- 二段階認証の有効化
- スタッフごとの権限管理

---

## PR戦略

### 1. プレスリリース（実装完了後）

**タイトル案:**
```
離島×Web3：加計呂麻島の宿「ばんしろう」が
暗号資産JPYCを活用した投げ銭システムを導入

〜QRコードで簡単アクセス、スタッフへ直接感謝を贈る新しい観光体験〜
```

**本文構成:**
1. 導入の背景
   - 離島ならではの課題
   - スタッフのモチベーション向上の必要性
   - Web3技術の可能性

2. システムの特徴
   - QRコードで簡単アクセス
   - スタッフの顔が見えるサービス
   - 暗号資産で国境を越えた感謝
   - Googleレビューまでシームレス

3. 期待される効果
   - スタッフの意欲向上
   - サービス品質の向上
   - 観光地としてのPR効果

4. 今後の展開
   - 他の施設への展開
   - 機能拡張の予定

---

### 2. SNS発信

**Twitter/X投稿案:**
```
🏝️ 加計呂麻島×Web3

お食事処もっか・宿ばんしろうで
JPYC投げ銭システムを導入しました！

✅ QRコードで簡単アクセス
✅ スタッフへ直接チップ
✅ Googleレビューもシームレス

離島の新しい観光体験、ぜひお試しください🎉

#Web3 #観光DX #奄美大島 #JPYC #加計呂麻島
```

**Instagram投稿案:**
- スタッフがQRコードを持っている写真
- 利用者ページのスクリーンショット
- 投げ銭が成功した画面
- お客様の笑顔の写真

**ハッシュタグ:**
```
#もっか #ばんしろう #加計呂麻島 #奄美大島
#Web3 #JPYC #暗号資産 #観光DX #投げ銭
#スタッフ応援 #離島観光 #新しい体験
```

---

### 3. JPYC社長への連絡

**送付先:**
- Twitter/X: @jpyc_inc（公式アカウント）
- メール: info@jpyc.jp

**送付内容:**
1. プレスリリース文章
2. システムのスクリーンショット
   - 利用者ページ
   - 投げ銭画面
   - 統計ダッシュボード
3. 実績データ（運用開始後）
   - 投げ銭回数
   - 利用者数
   - スタッフの声
4. メディア掲載実績（あれば）

**依頼内容:**
```
JPYC社長様

お世話になっております。
鹿児島県奄美大島・加計呼麻島で宿泊施設を運営している◯◯です。

この度、JPYCを活用した投げ銭システムを導入しましたので、
ご報告させていただきます。

離島という地理的特性とWeb3技術を組み合わせた
新しい観光体験として、多くの方にご利用いただいております。

もしよろしければ、SNS等でご紹介いただけますと幸いです。

添付: プレスリリース、スクリーンショット、実績データ
```

---

### 4. メディア露出

**ターゲットメディア:**
- 地元新聞: 南海日日新聞、奄美新聞
- 観光メディア: トラベルボイス、観光経済新聞
- Web3メディア: CoinPost、あたらしい経済
- IT系メディア: TechCrunch Japan、ITmedia

**プレスリリース配信サービス:**
- PR TIMES（推奨）
- @Press
- ValuePress

**想定される記事タイトル:**
```
「離島がWeb3で変わる！加計呂麻島の挑戦」
「暗号資産で感謝を贈る、新しい観光体験」
「QRコード×JPYCで実現する、スタッフ応援システム」
```

---

### 5. 利用者の声（テストユーザーから収集）

**収集する内容:**
- システムの使いやすさ
- MetaMaskの操作感
- 投げ銭体験の感想
- スタッフへのメッセージ

**活用方法:**
- ウェブサイトに掲載
- SNSで紹介
- プレスリリースに引用

---

### 6. 数値目標

**運用開始後3ヶ月:**
- 投げ銭回数: 100回以上
- 利用者ページアクセス: 200回以上
- Googleレビュー獲得: 20件以上
- メディア掲載: 3媒体以上

**運用開始後6ヶ月:**
- 投げ銭回数: 300回以上
- 利用者ページアクセス: 500回以上
- Googleレビュー獲得: 50件以上
- メディア掲載: 5媒体以上

**KPI:**
- 投げ銭率: 利用者の30%以上が投げ銭
- レビュー投稿率: 利用者の20%以上がレビュー投稿
- QRコード読み取り率: 配布したQRコードの80%以上が読み取られる

---

## 付録

### A. 用語集

| 用語 | 説明 |
|------|------|
| JPYC | 日本円にペッグされた暗号資産（1 JPYC = 1円） |
| Polygon | イーサリアムのサイドチェーン、低ガス代が特徴 |
| MetaMask | 暗号資産ウォレット（ブラウザ拡張機能/アプリ） |
| ガス代 | ブロックチェーン上のトランザクション手数料 |
| トランザクションハッシュ | ブロックチェーン上の取引ID |
| RPC | Remote Procedure Call、ブロックチェーンとの通信方法 |
| Web3 | 分散型インターネット技術の総称 |

---

### B. 参考リンク

**JPYC公式:**
- ウェブサイト: https://jpyc.jp/
- ドキュメント: https://docs.jpyc.jp/
- Twitter: https://twitter.com/jpyc_inc

**Polygon:**
- ウェブサイト: https://polygon.technology/
- Polygonscan: https://polygonscan.com/

**MetaMask:**
- ウェブサイト: https://metamask.io/
- ダウンロード: https://metamask.io/download/

**ethers.js:**
- ドキュメント: https://docs.ethers.org/v6/

---

### C. トラブルシューティングFAQ

**Q1: MetaMaskをインストールできない**
A: App Store（iOS）またはGoogle Play（Android）から「MetaMask」で検索してください。ブラウザ版はChrome Web Storeからインストールできます。

**Q2: Polygonネットワークに切り替えられない**
A: MetaMaskで「設定」→「ネットワーク」→「ネットワークを追加」から手動で追加できます。
- ネットワーク名: Polygon Mainnet
- RPC URL: https://polygon-rpc.com/
- チェーンID: 137
- 通貨記号: MATIC

**Q3: JPYC残高が表示されない**
A: MetaMaskで「トークンをインポート」からJPYCを追加してください。
- トークンアドレス: 0x6AE7Dfc73E0dDE2aa99ac063DcF7e8A63265108c

**Q4: ガス代（MATIC）が足りない**
A: 取引所でMATICを購入し、Polygonネットワークに送金してください。必要なMATICは0.01-0.1程度（数円）です。

**Q5: 投げ銭が反映されない**
A: トランザクションの確認に数秒〜数十秒かかる場合があります。Polygonscanでトランザクションハッシュを検索して確認してください。

---

### D. 変更履歴

| 日付 | バージョン | 変更内容 | 作成者 |
|------|-----------|---------|--------|
| 2025/12/30 | 1.0 | 初版作成 | Claude |

---

**以上**
