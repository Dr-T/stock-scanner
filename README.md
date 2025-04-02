# 股票分析系统 (Stock Analysis System)

## 简介

基于 https://github.com/DR-lin-eng/stock-scanner 二次修改，感谢原作者  

## 功能变更

1. 增加html页面，支持浏览器在线使用  
2. 增加港股、美股支持  
3. 完善Dockerfile、GitHub Actions 支持docker一键部署使用  
4. 支持x86_64 和 ARM64架构镜像  
5. 支持流式输出，支持前端传入Key(仅作为本地用户使用，日志等内容不会输出) 感谢@Cassianvale  
6. 重构为Vue3+Vite+TS+Naive UI，支持响应式布局  
7. 支持GitHub Actions 一键部署  
8. 支持Nginx反向代理，可通过80/443端口访问
9. 支持Vercel一键部署，轻松实现前端应用托管

## Vercel一键部署

本项目支持使用Vercel进行完整部署，包括前端应用和Serverless API功能，实现快速上线和全球CDN加速。

### 部署步骤

1. Fork本仓库到你的GitHub账号

2. 注册并登录[Vercel](https://vercel.com/)

3. 在Vercel中导入你fork的GitHub仓库
   - 点击"New Project"
   - 选择你fork的仓库
   - 配置项目设置

4. 配置构建设置
   - 设置构建命令: `cd frontend && npm install && npm run build`
   - 输出目录: `frontend/dist`
   - 安装命令: `cd frontend && npm install`
   - 开发命令: `cd frontend && npm run dev`

5. 配置环境变量
   在Vercel项目设置中添加以下环境变量:
   ```
   API_KEY=你的API密钥
   API_URL=你的API地址
   API_MODEL=你的API模型
   API_TIMEOUT=超时时间(默认60秒)
   LOGIN_PASSWORD=登录密码(可选)
   ANNOUNCEMENT_TEXT=公告文本
   ```

6. 点击"Deploy"按钮开始部署

7. 部署完成后，Vercel会提供一个域名，可以直接访问你的应用

### Serverless API功能

本项目已完全支持通过Vercel的Serverless函数实现后端API功能，无需额外部署Python服务器。主要API功能包括：

- `/api/config` - 获取应用配置信息
- `/api/login` - 用户登录认证
- `/api/analyze` - 股票分析功能（模拟数据）
- `/api/test_api_connection` - 测试外部API连接

这些API通过`frontend/api/index.js`实现，并在`frontend/vercel.json`中配置了正确的路由。

### 注意事项

- Vercel部署已支持基本的API功能，但某些数据密集型操作仍有限制
- Serverless函数提供模拟分析结果，如需真实分析，可以配置`API_URL`连接到外部API服务
- 对于需要完整分析能力的场景，仍建议使用Docker部署完整应用

## Docker镜像一键部署

```
# 拉取最新版本
docker pull cassianvale/stock-scanner:latest

# 启动主应用容器
docker run -d \
  --name stock-scanner-app \
  --network stock-scanner-network \
  -p 8888:8888 \
  -v "$(pwd)/logs:/app/logs" \
  -v "$(pwd)/data:/app/data" \
  -e API_KEY="你的API密钥" \
  -e API_URL="你的API地址" \
  -e API_MODEL="你的API模型" \
  -e API_TIMEOUT="60" \
  -e LOGIN_PASSWORD="你的登录密码" \
  -e ANNOUNCEMENT_TEXT="你的公告内容" \
  --restart unless-stopped \
  cassianvale/stock-scanner:latest
  
# 运行Nginx容器
docker run -d \
  --name stock-scanner-nginx \
  --network stock-scanner-network \
  -p 80:80 \
  -p 443:443 \
  -v "$(pwd)/nginx/nginx.conf:/etc/nginx/conf.d/default.conf" \
  -v "$(pwd)/nginx/logs:/var/log/nginx" \
  -v "$(pwd)/nginx/ssl:/etc/nginx/ssl" \
  --restart unless-stopped \
  nginx:stable-alpine

针对API_URL处理兼容更多的api地址，规则与Cherry Studio一致， /结尾忽略v1版本，#结尾强制使用输入地址。
API_URL 处理逻辑说明：
1. 当 API_URL 以 / 结尾时直接追加 chat/completions，保留原有版本号：
  示例：
   输入: https://ark.cn-beijing.volces.com/api/v3/
   输出: https://ark.cn-beijing.volces.com/api/v3/chat/completions
2. 当 API_URL 以 # 结尾时强制使用当前链接：
  示例：
   输入: https://ark.cn-beijing.volces.com/api/v3/chat/completions#
   输出: https://ark.cn-beijing.volces.com/api/v3/chat/completions
3. 当 API_URL 不以 / 结尾时使用默认版本号 v1：
  示例：
   输入: https://ark.cn-beijing.volces.com/api
   输出: https://ark.cn-beijing.volces.com/api/v1/chat/completions


```

默认8888端口，部署完成后访问  http://你的域名或ip:8888 即可使用  

## 使用Nginx反向代理

项目已集成Nginx服务，可以通过80端口(HTTP)和443端口(HTTPS)访问应用  
使用docker-compose启动：  

```shell
# 克隆仓库
git clone https://github.com/cassianvale/stock-scanner.git
cd stock-scanner

# 创建.env文件并填写必要的环境变量
cat > .env << EOL
API_KEY=你的API密钥
API_URL=你的API地址
API_MODEL=你的API模型
API_TIMEOUT=超时时间(默认60秒)
LOGIN_PASSWORD=登录密码(可选)
ANNOUNCEMENT_TEXT=公告文本
EOL

# 创建SSL证书目录
mkdir -p nginx/ssl

# 生成自签名SSL证书（仅用于测试环境）
openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

# 启动服务
docker-compose up -d
```

### 使用自己的SSL证书

如果您有自己的SSL证书，可以替换自签名证书：

1. 将您的证书文件放在 `nginx/ssl/` 目录下
2. 确保证书文件命名为 `fullchain.pem`，私钥文件命名为 `privkey.pem`
3. 重启服务: `docker-compose restart nginx`

相关参考：[免费泛域名 SSL 证书申请及自动续期（使用 1Panel 面板）](https://bronya-zaychik.cn/archives/GenSSL.html)

## Github Actions 部署

| 环境变量 | 说明 |
| --- | --- |
| DOCKERHUB_USERNAME | Docker Hub用户名 |
| DOCKERHUB_TOKEN | Docker Hub访问令牌 |
| SERVER_HOST | 部署服务器地址 |
| SERVER_USERNAME | 服务器用户名 |
| SSH_PRIVATE_KEY | SSH私钥 |
| DEPLOY_PATH | 部署路径 |
| SLACK_WEBHOOK | Slack通知Webhook（可选） |


## Vercel与Docker部署对比

| 特性 | Vercel部署 | Docker部署 |
| --- | --- | --- |
| 部署难度 | 简单，几分钟内完成 | 中等，需要服务器和Docker知识 |
| 功能完整性 | 前端功能完整，基本API功能已支持 | 完整支持所有高级分析功能 |
| 全球访问速度 | 快速（全球CDN） | 取决于服务器位置 |
| 成本 | 个人项目免费 | 需要自备服务器 |
| 数据处理能力 | 基本分析（通过Serverless函数） | 强大（完整的Python分析引擎） |
| 适用场景 | 展示、基本分析功能 | 高级分析、数据密集型应用 |


## 注意事项 (Notes)
- 股票分析仅供参考，不构成投资建议
- 使用前请确保网络连接正常
- 建议在实盘前充分测试

## 贡献 (Contributing)
欢迎提交 issues 和 pull requests！

## 许可证 (License)
[待添加具体许可证信息]

## 免责声明 (Disclaimer)
本系统仅用于学习和研究目的，投资有风险，入市需谨慎。
