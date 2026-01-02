# LINE連携機能 企画仕様書

**作成日**: 2026年1月3日
**ステータス**: 企画段階
**最終更新**: 2026年1月3日

---

## 1. 概要

### 1.1 目的
LINE Messaging APIを活用し、顧客体験(UX)の向上とスタッフ業務の大幅な効率化を実現する。

### 1.2 期待効果
- **顧客向け**: セルフサービス化による利便性向上
- **スタッフ向け**: 電話対応・手動処理の削減
- **経営向け**: 顧客データ活用によるマーケティング自動化

### 1.3 設計方針
- **モジュラー設計**: 各機能を独立したモジュールとして実装
- **段階的導入**: 優先度の高い機能から順次リリース
- **既存システム統合**: mocca-portalの既存モジュールと連携

---

## 2. モジュール構成

```
app/Modules/
├── Line/                    # LINEコア（必須・基盤）+ 多店舗対応
│   ├── LineModule.php
│   ├── Controllers/
│   │   └── WebhookController.php
│   ├── Services/
│   │   ├── LineMessagingService.php
│   │   ├── LineUserService.php
│   │   └── LineStoreService.php      # 多店舗管理
│   └── Models/
│       ├── LineUser.php
│       └── LineStore.php             # 店舗別設定
│
├── LineDelivery/            # デリバリー予約・決済
│   ├── LineDeliveryModule.php
│   ├── Controllers/
│   ├── Services/
│   └── Models/
│
├── LineNotification/        # 通知機能 + メニュー通知
│   ├── LineNotificationModule.php
│   ├── Controllers/
│   └── Services/
│       ├── NotificationService.php
│       └── MenuNotificationService.php  # 本日のおすすめ等
│
├── LineChatbot/             # AIチャットボット
│   ├── LineChatbotModule.php
│   ├── Controllers/
│   └── Services/
│
├── LineCrm/                 # 顧客管理・セグメント
│   ├── LineCrmModule.php
│   ├── Controllers/
│   └── Services/
│
├── LineMarketing/           # マーケティング自動化
│   ├── LineMarketingModule.php
│   ├── Controllers/
│   └── Services/
│
├── LineAnalytics/           # LINE分析ダッシュボード + 日報
│   ├── LineAnalyticsModule.php
│   ├── Controllers/
│   │   └── DashboardController.php
│   └── Services/
│       ├── AnalyticsService.php
│       └── DailyReportService.php    # 日報自動配信
│
├── LinePoints/              # ポイント・スタンプカード
│   ├── LinePointsModule.php
│   ├── Controllers/
│   ├── Services/
│   └── Models/
│       ├── PointCard.php
│       └── PointHistory.php
│
├── LineReferral/            # 紹介プログラム
│   ├── LineReferralModule.php
│   ├── Controllers/
│   ├── Services/
│   └── Models/
│       └── Referral.php
│
├── LineReview/              # レビュー収集
│   ├── LineReviewModule.php
│   ├── Controllers/
│   ├── Services/
│   └── Models/
│       └── Review.php
│
└── LineCoupon/              # クーポン管理
    ├── LineCouponModule.php
    ├── Controllers/
    ├── Services/
    └── Models/
        ├── Coupon.php
        └── CouponUsage.php
```

---

## 3. 機能詳細

### 3.1 LINEコアモジュール（Line）

基盤となるモジュール。他のLINE関連モジュールはこれに依存する。

#### 機能
| 機能 | 説明 |
|------|------|
| Webhook受信 | LINEプラットフォームからのイベント受信 |
| ユーザー認証 | LINE IDとportalユーザーの紐付け |
| メッセージ送信 | プッシュ通知・リプライの共通処理 |
| リッチメニュー | カスタムメニューの管理 |
| **多店舗対応** | もっか/ばんしろう別々のリッチメニュー・設定管理 |

#### データモデル
```sql
-- ユーザー管理
CREATE TABLE line_users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NULL,                    -- portal users.id（紐付け済みの場合）
    line_user_id VARCHAR(255) NOT NULL,     -- LINE UID
    display_name VARCHAR(255),
    picture_url TEXT,
    status_message TEXT,
    is_blocked BOOLEAN DEFAULT FALSE,
    friend_added_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE KEY (line_user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 多店舗設定
CREATE TABLE line_stores (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    location_id BIGINT NOT NULL,            -- portal locations.id
    store_name VARCHAR(255) NOT NULL,       -- もっか / ばんしろう
    channel_id VARCHAR(255),                -- LINE Channel ID（店舗別の場合）
    channel_secret VARCHAR(255),
    channel_access_token TEXT,
    rich_menu_id VARCHAR(255),              -- 店舗別リッチメニュー
    welcome_message TEXT,                   -- 友だち追加時メッセージ
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id)
);
```

#### 多店舗対応設計
```
【単一アカウント方式】
1つのLINE公式アカウントで複数店舗を管理
├── リッチメニューで店舗選択
├── 顧客に店舗を紐付け
└── 配信時に店舗フィルタリング

【複数アカウント方式】
店舗ごとに別々のLINE公式アカウント
├── もっか専用アカウント
├── ばんしろう専用アカウント
└── Webhookは共通エンドポイントで振り分け
```

#### API設計
```
POST /api/line/webhook              # Webhook受信エンドポイント
POST /api/line/link                 # ユーザーアカウント連携
DELETE /api/line/link               # 連携解除
```

---

### 3.2 デリバリーモジュール（LineDelivery）

#### 機能
| 機能 | 説明 |
|------|------|
| メニュー表示 | LIFF（LINEミニアプリ）でメニュー一覧 |
| カート機能 | 商品選択・数量調整 |
| 配達先指定 | 住所入力・履歴からの選択 |
| 時間指定 | 配達希望時間の選択 |
| 決済処理 | **※クライアント確認事項** |
| 注文確定 | 店舗への通知・顧客への確認 |
| ステータス更新 | 調理中→出発→配達完了 |

#### 顧客フロー
```
[LINE リッチメニュー]
        ↓
[LIFF: メニュー選択]
        ↓
[LIFF: カート確認]
        ↓
[LIFF: 配達先・時間指定]
        ↓
[決済画面] ※要確認
        ↓
[注文確定通知]
        ↓
[出発通知] → [到着通知]
```

#### 店舗側フロー
```
[新規注文通知（LINE/Portal）]
        ↓
[調理開始ボタン]
        ↓
[出発ボタン] → 顧客に自動通知
        ↓
[完了ボタン]
```

#### 決済オプション（クライアント確認事項）
| 方式 | 手数料 | 備考 |
|------|--------|------|
| LINE Pay | 2.45%〜 | 審査必要 |
| PayPay | 1.98%〜 | 審査必要 |
| Stripe（カード） | 3.6% | 導入容易 |
| 現金（代引き） | 0% | 配達員対応必要 |
| 既存JPYC連携 | 低コスト | 実装済み基盤活用 |

**→ どの決済方式を採用するかクライアントに確認が必要**

---

### 3.3 通知モジュール（LineNotification）

#### 機能
| 通知種別 | トリガー | 内容 |
|----------|----------|------|
| チェックイン案内 | 予約日前日 | アクセス方法・Wi-Fi情報 |
| チェックアウト案内 | チェックアウト日朝 | 手順・忘れ物確認 |
| 乗り換え案内 | 友だち追加時/予約時 | 最寄り駅からのルート |
| 利用案内 | チェックイン時 | 設備の使い方・注意事項 |
| デリバリー出発 | 出発ボタン押下 | 到着予定時刻 |
| インスタライブ | ライブ開始時 | 配信中通知 |
| お知らせ | 管理者が配信 | イベント・キャンペーン |
| **本日のおすすめ** | 毎日指定時刻 | 日替わりメニュー・限定品 |
| **新メニュー通知** | メニュー追加時 | 新商品のお知らせ |

#### Instagram Live連携
```
[Instagram Live開始]
        ↓
[Meta Webhook検知]
        ↓
[mocca-portal受信]
        ↓
[LINE一斉配信]
        ↓
[視聴→購買導線] ※ECは外部システム
```

---

### 3.4 AIチャットボットモジュール（LineChatbot）

#### 機能
| 機能 | 説明 |
|------|------|
| FAQ自動応答 | よくある質問への即時回答 |
| 予約受付 | 自然言語での予約処理 |
| 注文受付 | テキストでの注文対応 |
| エスカレーション | 対応不可時のスタッフ転送 |

#### 自動応答例
```
Q: 「営業時間教えて」
A: 「営業時間は11:00〜23:00です。ラストオーダーは22:30となります。」

Q: 「駐車場ある？」
A: 「はい、店舗横に5台分の駐車場がございます。」

Q: 「予約したい」
A: 「ご予約ありがとうございます。ご希望の日時を教えてください。」
   → 予約フローへ遷移

Q: 「（複雑な質問）」
A: 「担当者におつなぎします。しばらくお待ちください。」
   → スタッフに通知
```

#### 技術選択肢
| 方式 | 精度 | コスト | 導入難易度 |
|------|------|--------|-----------|
| ルールベース | 中 | 低 | 低 |
| OpenAI API | 高 | 従量課金 | 中 |
| Claude API | 高 | 従量課金 | 中 |
| Dialogflow | 中〜高 | 従量課金 | 中 |

---

### 3.5 顧客管理モジュール（LineCrm）

#### 機能
| 機能 | 説明 |
|------|------|
| 顧客データ統合 | LINE + 店舗来店 + 注文履歴 |
| セグメント作成 | 条件ベースのグループ分け |
| 顧客分析 | LTV・来店頻度・嗜好分析 |
| リスト出力 | CSV/Excel形式でのエクスポート |

#### 取得・蓄積データ
```
LINE基本情報
├── LINE UID
├── 表示名
├── プロフィール画像
├── 友だち追加日
└── ブロック状態

行動データ（自動蓄積）
├── 来店履歴
├── 注文履歴
├── 注文金額・内容
├── 好みのメニュー
├── 配信開封率
├── クーポン利用履歴
└── インスタライブ視聴
```

#### セグメント例
| セグメント名 | 条件 |
|-------------|------|
| 休眠顧客 | 30日以上来店なし |
| VIP顧客 | 月3回以上来店 または 月額10,000円以上 |
| 新規顧客 | 友だち追加7日以内 |
| 誕生月顧客 | 今月が誕生月 |
| デリバリーユーザー | デリバリー利用歴あり |

---

### 3.6 マーケティング自動化モジュール（LineMarketing）

#### 機能
| 機能 | 説明 |
|------|------|
| セグメント配信 | 条件に応じた自動メッセージ |
| ステップ配信 | 友だち追加後のシナリオ配信 |
| 日時指定配信 | スケジュール配信 |
| A/Bテスト | 配信内容の効果測定 |
| 効果分析 | 開封率・クリック率・CV率 |

#### 自動配信シナリオ例
```
【新規友だち追加後】
Day 0: ウェルカムメッセージ + 初回クーポン
Day 3: おすすめメニュー紹介
Day 7: 来店確認（未来店なら再アプローチ）

【休眠顧客】
30日経過: 「お久しぶりです」+ 復帰クーポン
60日経過: 限定特典のご案内

【VIP顧客】
月初: 月間お得情報（限定メニュー先行案内）
誕生月: バースデー特典
```

---

### 3.7 分析・日報モジュール（LineAnalytics）

#### 機能
| 機能 | 説明 |
|------|------|
| 友だち数推移 | 日次・週次・月次のグラフ表示 |
| ブロック率分析 | ブロック数・率の推移 |
| 配信効果分析 | 開封率・クリック率・CV率 |
| セグメント分析 | セグメント別の反応率 |
| 日報自動配信 | 毎日指定時刻に売上・予約状況を自動送信 |

#### ダッシュボード表示項目
```
【LINE統計】
├── 総友だち数 / 新規追加数（今日・今週・今月）
├── ブロック数 / ブロック率
├── アクティブユーザー数
└── 配信到達率

【配信効果】
├── 最新配信の開封率
├── リンククリック率
├── クーポン使用率
└── 配信別CV比較

【店舗別】（多店舗対応）
├── もっか: 友だち数・売上
└── ばんしろう: 友だち数・売上
```

#### 日報自動配信
```
毎日 23:00 自動送信（管理者LINE宛）
─────────────────────
📊 本日の日報 (2026/01/03)
─────────────────────
【売上】
・もっか: ¥125,000
・ばんしろう: ¥89,000

【予約】
・本日来店: 15組
・明日予約: 12組

【デリバリー】
・注文数: 8件
・売上: ¥32,000

【LINE】
・新規友だち: +5
・ブロック: 0
─────────────────────
```

---

### 3.8 ポイント・スタンプカードモジュール（LinePoints）

#### 機能
| 機能 | 説明 |
|------|------|
| ポイント付与 | 来店・注文金額に応じて自動付与 |
| スタンプカード | 来店回数でスタンプ、満了で特典 |
| ポイント残高確認 | LINEから残高照会 |
| ポイント利用 | 会計時にポイント割引 |
| 有効期限管理 | 期限前リマインド通知 |

#### データモデル
```sql
CREATE TABLE line_point_cards (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    line_user_id BIGINT NOT NULL,
    store_id BIGINT NULL,                   -- 店舗別ポイントの場合
    total_points INT DEFAULT 0,
    lifetime_points INT DEFAULT 0,          -- 累計獲得ポイント
    stamp_count INT DEFAULT 0,              -- スタンプ数
    tier VARCHAR(50) DEFAULT 'regular',     -- 会員ランク
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (line_user_id) REFERENCES line_users(id)
);

CREATE TABLE line_point_histories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    point_card_id BIGINT NOT NULL,
    type ENUM('earn', 'use', 'expire', 'adjust'),
    points INT NOT NULL,
    balance_after INT NOT NULL,
    description VARCHAR(255),
    reference_type VARCHAR(50),             -- order, visit, campaign, etc.
    reference_id BIGINT,
    created_at TIMESTAMP,
    FOREIGN KEY (point_card_id) REFERENCES line_point_cards(id)
);
```

#### ポイントルール（例）
```
【付与】
・来店: 100pt
・注文金額: 100円 = 1pt
・誕生月来店: 2倍ポイント
・紹介成立: 500pt

【利用】
・1pt = 1円として利用可能
・最低利用: 100pt〜

【スタンプカード】
・来店1回 = 1スタンプ
・10スタンプ達成 = ドリンク1杯無料
```

---

### 3.9 紹介プログラムモジュール（LineReferral）

#### 機能
| 機能 | 説明 |
|------|------|
| 紹介コード発行 | ユーザーごとにユニークコード |
| 紹介トラッキング | 誰が誰を紹介したか記録 |
| 特典付与 | 紹介者・被紹介者双方に自動付与 |
| 成果確認 | 紹介実績の確認画面 |

#### データモデル
```sql
CREATE TABLE line_referrals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    referrer_id BIGINT NOT NULL,            -- 紹介者
    referred_id BIGINT NOT NULL,            -- 被紹介者
    referral_code VARCHAR(50) NOT NULL,
    status ENUM('pending', 'completed', 'rewarded'),
    referrer_reward_points INT,
    referred_reward_points INT,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES line_users(id),
    FOREIGN KEY (referred_id) REFERENCES line_users(id)
);
```

#### フロー
```
【紹介者】
LINEで「紹介コードを発行」
    ↓
ユニークURL/コード取得
    ↓
友達にシェア

【被紹介者】
紹介リンクから友だち追加
    ↓
初回来店/注文
    ↓
双方に特典付与 + 通知
```

#### 特典例
```
紹介者: 500ポイント
被紹介者: 初回10%OFF + 200ポイント
```

---

### 3.10 レビュー収集モジュール（LineReview）

#### 機能
| 機能 | 説明 |
|------|------|
| 自動アンケート送信 | 来店/利用後に自動送信 |
| 星評価収集 | 5段階評価 |
| コメント収集 | 自由記述 |
| レビュー管理 | 管理画面での確認・返信 |
| Google口コミ誘導 | 高評価者にGoogle口コミ依頼 |

#### データモデル
```sql
CREATE TABLE line_reviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    line_user_id BIGINT NOT NULL,
    store_id BIGINT NULL,
    rating INT NOT NULL,                    -- 1-5
    comment TEXT,
    visit_date DATE,
    order_id BIGINT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    admin_reply TEXT,
    replied_at TIMESTAMP NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (line_user_id) REFERENCES line_users(id)
);
```

#### フロー
```
来店/デリバリー完了
    ↓
翌日自動送信「ご利用ありがとうございました」
    ↓
「サービスはいかがでしたか？」（5段階）
    ↓
【4-5点の場合】
「ありがとうございます！よろしければGoogle口コミもお願いします」
+ Googleマップリンク

【1-3点の場合】
「貴重なご意見ありがとうございます。改善に努めます」
+ 詳細ヒアリング（任意）
```

---

### 3.11 クーポン管理モジュール（LineCoupon）

#### 機能
| 機能 | 説明 |
|------|------|
| クーポン作成 | 管理画面から発行設定 |
| 自動配布 | 条件に応じた自動配布 |
| 使用管理 | QRコード/コード入力で使用 |
| 有効期限管理 | 期限切れ前リマインド |
| 効果測定 | 使用率・売上貢献分析 |

#### データモデル
```sql
CREATE TABLE line_coupons (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type ENUM('percent', 'fixed', 'free_item'),
    discount_value DECIMAL(10,2),
    free_item_name VARCHAR(255),
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    max_uses INT NULL,                      -- 全体の使用上限
    max_uses_per_user INT DEFAULT 1,        -- ユーザーあたり上限
    current_uses INT DEFAULT 0,
    store_id BIGINT NULL,                   -- 店舗限定の場合
    starts_at TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE line_coupon_usages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    coupon_id BIGINT NOT NULL,
    line_user_id BIGINT NOT NULL,
    order_id BIGINT NULL,
    discount_amount DECIMAL(10,2),
    used_at TIMESTAMP,
    FOREIGN KEY (coupon_id) REFERENCES line_coupons(id),
    FOREIGN KEY (line_user_id) REFERENCES line_users(id)
);
```

#### クーポン種類（例）
```
【割引系】
・初回限定10%OFF
・500円引きクーポン
・デリバリー送料無料

【無料系】
・ドリンク1杯無料
・デザートサービス

【条件付き】
・3,000円以上で使用可
・平日限定
・もっか店舗限定
```

#### 自動配布トリガー
```
・友だち追加時 → ウェルカムクーポン
・誕生月 → バースデークーポン
・30日未来店 → 復帰クーポン
・紹介成立時 → 紹介特典クーポン
・レビュー投稿後 → お礼クーポン
```

---

## 4. 外部EC連携について

ECサイト（グッズ販売等）を実施する場合は、**LINE内ではなく外部の専用ECプラットフォームを使用**する。

### 連携方式
```
[LINE通知]
    ↓
[外部ECサイトへリンク]  ← Shopify / BASE / STORES 等
    ↓
[購入処理は外部で完結]
    ↓
[購入情報をmocca-portalにAPI連携]（オプション）
```

### LINE側の役割
- 新商品・再入荷の通知
- セール・キャンペーン告知
- ECサイトへの誘導リンク

---

## 5. 技術要件

### 5.1 LINE Developers設定
- Messaging APIチャネル作成
- Webhook URL設定
- チャネルアクセストークン取得
- LIFFアプリ登録（デリバリー用）

### 5.2 必要パッケージ
```bash
composer require linecorp/line-bot-sdk
```

### 5.3 環境変数
```env
LINE_CHANNEL_ID=
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
LINE_LIFF_ID=
```

### 5.4 Meta API設定（Instagram連携用）
- Instagram Graph API
- Webhooks設定（Live Video）

---

## 6. 実装優先度

### フェーズ1: 基盤構築
| 優先度 | モジュール | 理由 |
|:------:|-----------|------|
| 1 | Line（コア+多店舗） | 全機能の基盤 |
| 2 | LineDelivery | 業務効率化の即効性 |
| 3 | LineNotification | 顧客体験向上 |

### フェーズ2: 顧客管理・分析
| 優先度 | モジュール | 理由 |
|:------:|-----------|------|
| 4 | LineCrm | データ活用基盤 |
| 5 | LineAnalytics | 効果測定・日報自動化 |
| 6 | LineCoupon | 販促の基本機能 |

### フェーズ3: エンゲージメント強化
| 優先度 | モジュール | 理由 |
|:------:|-----------|------|
| 7 | LinePoints | リピート促進 |
| 8 | LineReview | 口コミ・評価収集 |
| 9 | LineReferral | 新規顧客獲得 |

### フェーズ4: 自動化・高度化
| 優先度 | モジュール | 理由 |
|:------:|-----------|------|
| 10 | LineChatbot | 問い合わせ自動化 |
| 11 | LineMarketing | マーケティング自動化 |

---

## 7. クライアント確認事項

### 7.1 決済方式
以下から選択、または組み合わせを決定：
- [ ] LINE Pay
- [ ] PayPay
- [ ] Stripe（クレジットカード）
- [ ] 代引き（現金）
- [ ] 既存JPYC連携

### 7.2 LINE公式アカウント
- [ ] 既存アカウントの有無
- [ ] アカウント方式
  - [ ] 単一アカウント（もっか・ばんしろう共通）
  - [ ] 複数アカウント（店舗別）
- [ ] プラン選択（フリー/ライト/スタンダード）
  - フリー: 月1,000通まで無料
  - ライト: 月5,000通 / 月額5,000円
  - スタンダード: 月30,000通 / 月額15,000円

### 7.3 AIチャットボット
- [ ] 導入有無
- [ ] 使用API（OpenAI / Claude / ルールベース）

### 7.4 Instagram連携
- [ ] インスタライブ通知の要否
- [ ] 連携するInstagramアカウント

### 7.5 EC連携
- [ ] 実施有無
- [ ] 使用プラットフォーム（Shopify / BASE / STORES / その他）

### 7.6 ポイント・スタンプカード
- [ ] 導入有無
- [ ] ポイントルール（付与率・利用条件）
- [ ] スタンプカード（何回で特典か）
- [ ] 店舗共通 or 店舗別

### 7.7 紹介プログラム
- [ ] 導入有無
- [ ] 特典内容（ポイント数・クーポン内容）

### 7.8 レビュー収集
- [ ] 導入有無
- [ ] Google口コミ誘導の有無
- [ ] 各店舗のGoogleマップURL

### 7.9 日報配信
- [ ] 導入有無
- [ ] 配信時刻
- [ ] 配信先（管理者のLINE ID）

---

## 8. 今後のステップ

1. **クライアント確認**: 決済方式・LINEプラン・オプション機能の決定
2. **LINE Developers設定**: チャネル作成・Webhook設定
3. **コアモジュール実装**: Line基盤モジュールの開発
4. **段階的機能追加**: 優先度順にモジュール実装
5. **テスト・検証**: 各機能の動作確認
6. **本番リリース**: 段階的にリリース

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-01-03 | 初版作成（企画段階） |
| 2026-01-03 | 追加モジュール: 多店舗対応、分析・日報、ポイント、紹介、レビュー、クーポン、メニュー通知 |
