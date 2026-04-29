kill $(lsof -t -i:3000) 2>/dev/null; kill $(lsof -t -i:24678) 2>/dev/null; sleep 1
# rm -rf node_modules/.vite
echo "✓ 端口 3000 和 24678 已清理"