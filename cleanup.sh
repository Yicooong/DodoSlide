#!/bin/bash

PORTS=(3000 5173 24678)
PROCESS_NAMES=("node" "vite" "tsx")
CLEANED=false

echo "=== DodoSlide 端口/进程清理 ==="

# 检测端口占用
for PORT in "${PORTS[@]}"; do
  PID=$(lsof -t -i:$PORT 2>/dev/null)
  if [ -n "$PID" ]; then
    echo "端口 $PORT 被进程 PID=$PID 占用"
    kill -9 $PID 2>/dev/null && echo "  已杀死" && CLEANED=true
  fi
done

# 检测遗留进程（防止有非标准端口的进程）
for NAME in "${PROCESS_NAMES[@]}"; do
  PIDS=$(ps aux | grep "[D]odoSlide" | grep "$NAME" | awk '{print $2}')
  if [ -n "$PIDS" ]; then
    echo "遗留进程 $NAME: PID=$PIDS"
    kill -9 $PIDS 2>/dev/null && echo "  已杀死" && CLEANED=true
  fi
done

# 清理 Vite 缓存
if [ -d "node_modules/.vite" ]; then
  rm -rf node_modules/.vite
  echo "Vite 缓存已清理"
fi

if [ "$CLEANED" = false ]; then
  echo "没有需要清理的进程"
fi
