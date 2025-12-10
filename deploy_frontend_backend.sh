#!/bin/bash
set -euo pipefail

PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
BACKEND_IMAGE=${BACKEND_IMAGE:-aurora-backend:latest}
FRONTEND_IMAGE=${FRONTEND_IMAGE:-aurora-frontend:latest}
BACKEND_CONTAINER=${BACKEND_CONTAINER:-aurora-backend}
FRONTEND_CONTAINER=${FRONTEND_CONTAINER:-aurora-frontend}
NETWORK_NAME=${NETWORK_NAME:-aurora-app}
BACKEND_PORT=8080
FRONTEND_PORT=80
CONFIG_DIR="$PROJECT_ROOT/deploy/config"
UPLOAD_DIR="$PROJECT_ROOT/uploads"
SKIP_BUILD=false
DEPLOY_SUCCESS=false

usage() {
  cat <<'EOF'
用法: ./deploy_frontend_backend.sh [选项]

选项：
  --backend-port <端口>   对外暴露的后端端口（默认: 8080）
  --frontend-port <端口>  对外暴露的前端端口（默认: 80）
  --config-dir <路径>     application-prod.yml 所在目录，默认 deploy/config
  --upload-dir <路径>     本地上传目录，默认项目根目录下 uploads
  --skip-build            跳过 Maven / npm build，直接重新创建容器
  -h, --help              查看帮助

也可通过环境变量覆盖镜像/容器名称：
  BACKEND_IMAGE, FRONTEND_IMAGE, BACKEND_CONTAINER, FRONTEND_CONTAINER, NETWORK_NAME
EOF
}

ensure_absolute_path() {
  local input="$1"
  if [[ "$input" = /* ]]; then
    printf '%s\n' "$input"
  else
    printf '%s/%s\n' "$PROJECT_ROOT" "$input"
  fi
}

cleanup_on_exit() {
  if [[ "$DEPLOY_SUCCESS" != true ]]; then
    docker rm -f "$BACKEND_CONTAINER" "$FRONTEND_CONTAINER" >/dev/null 2>&1 || true
  fi
}

trap cleanup_on_exit EXIT

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backend-port)
      BACKEND_PORT="$2"
      shift 2
      ;;
    --frontend-port)
      FRONTEND_PORT="$2"
      shift 2
      ;;
    --config-dir)
      CONFIG_DIR="$2"
      shift 2
      ;;
    --upload-dir)
      UPLOAD_DIR="$2"
      shift 2
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift 1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "未知参数: $1" >&2
      usage
      exit 1
      ;;
  esac
done

CONFIG_DIR=$(ensure_absolute_path "$CONFIG_DIR")
UPLOAD_DIR=$(ensure_absolute_path "$UPLOAD_DIR")
CONFIG_FILE="$CONFIG_DIR/application-prod.yml"

mkdir -p "$CONFIG_DIR"
mkdir -p "$UPLOAD_DIR"

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "未找到 $CONFIG_FILE，请先准备 production 配置文件" >&2
  exit 1
fi

if ! docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
  echo "创建 docker 网络: $NETWORK_NAME"
  docker network create "$NETWORK_NAME" >/dev/null
fi

if [[ "$SKIP_BUILD" != true ]]; then
  command -v mvn >/dev/null 2>&1 || { echo "未找到 mvn，请先安装 Maven" >&2; exit 1; }
  command -v npm >/dev/null 2>&1 || { echo "未找到 npm，请先安装 Node.js" >&2; exit 1; }

  echo "开始构建后端..."
  pushd "$PROJECT_ROOT/aurora-springboot" >/dev/null
  mvn clean package -DskipTests
  docker build -t "$BACKEND_IMAGE" .
  popd >/dev/null

  echo "开始构建前端(博客)..."
  pushd "$PROJECT_ROOT/aurora-vue/aurora-blog" >/dev/null
  npm install
  npm run build
  popd >/dev/null

  echo "开始构建前端(后台)..."
  pushd "$PROJECT_ROOT/aurora-vue/aurora-admin" >/dev/null
  npm install
  npm run build
  popd >/dev/null

  echo "打包前端镜像..."
  pushd "$PROJECT_ROOT/aurora-vue" >/dev/null
  docker build -t "$FRONTEND_IMAGE" .
  popd >/dev/null
fi

stop_container_if_exists() {
  local name="$1"
  if docker ps -a --format '{{.Names}}' | grep -wq "$name"; then
    echo "删除旧容器: $name"
    docker rm -f "$name" >/dev/null
  fi
}

start_container() {
  local name="$1"
  shift
  if ! docker run -d --name "$name" "$@"; then
    echo "容器 $name 启动失败，正在清理..." >&2
    docker rm -f "$name" >/dev/null 2>&1 || true
    exit 1
  fi
}

stop_container_if_exists "$BACKEND_CONTAINER"
stop_container_if_exists "$FRONTEND_CONTAINER"

echo "启动后端容器 $BACKEND_CONTAINER，端口映射 $BACKEND_PORT:8080"
start_container "$BACKEND_CONTAINER" \
  --restart=always \
  --network "$NETWORK_NAME" \
  -p "$BACKEND_PORT:8080" \
  -v "$CONFIG_DIR":/config \
  -v "$UPLOAD_DIR":/uploads \
  "$BACKEND_IMAGE"

echo "启动前端容器 $FRONTEND_CONTAINER，端口映射 $FRONTEND_PORT:80"
start_container "$FRONTEND_CONTAINER" \
  --restart=always \
  --network "$NETWORK_NAME" \
  -p "$FRONTEND_PORT:80" \
  "$FRONTEND_IMAGE"

DEPLOY_SUCCESS=true

echo "部署完成。"
echo "前端：访问 http://<服务器IP>:$FRONTEND_PORT"
echo "后台管理：访问 http://<服务器IP>:$FRONTEND_PORT/admin"
