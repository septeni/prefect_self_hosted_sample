# prefect_self_hosted_sample
[こちら](https://zenn.dev/septeni_japan/articles/2024-06_prefect)で紹介しているCDKのサンプルコードです。

## 前提
- Node.js・npmがインストールされていること
  - Node.js >= 18.0.0
  - npm >= 10.2.0

## セットアップ

### 1. リポジトリをクローン
```bash
git clone git@github.com:septeni/prefect_self_hosted_sample.git
```

### 2. パッケージのインストール
```bash
npm install
```

### 3. 環境変数の設定
`.env`ファイルを作成し、以下の内容を記述してください。
```:.env
CDK_DEFAULT_ACCOUNT=xxxxx
CDK_DEFAULT_REGION=ap-northeast-1
```

## デプロイ
```bash
npx cdk deploy
```
