# Claude Code ガイドライン

## サーバー管理

コードを変更した後は必ずサーバーを再起動すること。

### 再起動手順

```bash
# 1. ポート8080のプロセスを停止
powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort 8080 -State Listen).OwningProcess -Force -ErrorAction SilentlyContinue"

# 2. サーバー起動
node server.js &
```

起動確認メッセージ: `Server started on :8080 (externalAuth=true)`
