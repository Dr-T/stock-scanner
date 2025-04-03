// Vercel Serverless API 适配器
const { createServer } = require('http');
const { parse } = require('url');
const axios = require('axios');

// 环境变量
const API_KEY = process.env.API_KEY || '';
const API_URL = process.env.API_URL || '';
const API_MODEL = process.env.API_MODEL || 'gpt-3.5-turbo';
const API_TIMEOUT = process.env.API_TIMEOUT || '60';
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD || '';
const ANNOUNCEMENT_TEXT = process.env.ANNOUNCEMENT_TEXT || '';

// 处理API请求
async function handleRequest(req, res) {
  try {
    const { pathname, query } = parse(req.url, true);
    // 修复路径匹配问题，确保正确处理API路径
    // 无论是直接访问/check_auth还是/api/check_auth都能正确匹配
    let path = pathname;
    console.log("1-path是"+${path});
    if (path.startsWith('/api/')) {
      path = path.substring(4); // 移除'/api/'前缀
    } else if (path === '/api') {
      path = '/';
    } else if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // 处理OPTIONS请求
    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      res.end();
      return;
    }
    
    // 配置信息接口
    if (path === '/config' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({
        requireLogin: Boolean(LOGIN_PASSWORD.trim()),
        announcement: ANNOUNCEMENT_TEXT
      }));
      return;
    }
    
    // 检查是否需要登录接口
    if ((path === '/need_login' || path === 'need_login') && req.method === 'GET') {
      console.log('检查是否需要登录:', { path, requireLogin: Boolean(LOGIN_PASSWORD.trim()) });
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({
        require_login: Boolean(LOGIN_PASSWORD.trim())
      }));
      return;
    }
    
    // 检查认证状态接口
    if ((path === '/check_auth' || path === 'check_auth') && req.method === 'GET') {
      const authHeader = req.headers.authorization;
      const isAuthenticated = Boolean(authHeader && authHeader.startsWith('Bearer '));
      console.log('检查认证状态:', { path, authHeader, isAuthenticated });
      
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({
        authenticated: isAuthenticated
      }));
      return;
    }
    
    // 登录接口
    if (path === '/login' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      
      await new Promise(resolve => {
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data.password === LOGIN_PASSWORD) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              // 简化的token生成
              const token = Buffer.from(Date.now().toString()).toString('base64');
              res.end(JSON.stringify({
                access_token: token,
                token_type: 'bearer'
              }));
            } else {
              res.statusCode = 401;
              res.end(JSON.stringify({ detail: '密码错误' }));
            }
          } catch (error) {
            res.statusCode = 400;
            res.end(JSON.stringify({ detail: '无效的请求' }));
          }
          resolve();
        });
      });
      return;
    }
    console.log("2-path是"+${path});
    
    // 需要登录检查的接口
    if (LOGIN_PASSWORD.trim() && path !== '/login') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.statusCode = 401;
        res.end(JSON.stringify({ detail: '未授权访问' }));
        return;
      }
      // 简化的token验证
      // 在实际应用中应该使用更安全的方法
    }
    
    // 转发到外部API的请求
    if (path === '/analyze' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      
      await new Promise(resolve => {
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            
            // 这里应该实现实际的股票分析逻辑
            // 由于完整实现需要后端服务的所有功能，这里只返回模拟数据
            
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({
              message: '在Vercel环境中，此功能需要连接到外部API或数据库服务',
              stocks: data.stock_codes.map(code => ({
                code,
                name: `模拟股票${code}`,
                analysis: '这是Vercel Serverless函数的模拟分析结果。在实际部署中，您需要连接到外部API或数据库服务来获取真实数据。'
              }))
            }));
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ detail: '服务器内部错误' }));
          }
          resolve();
        });
      });
      return;
    }

    console.log("3-path是"+${path});
    
    // 默认响应
    res.statusCode = 404;
    res.end(JSON.stringify({ detail: '未找到请求的资源' }));
    
  } catch (error) {
    console.error('API处理错误:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ detail: '服务器内部错误' }));
  }
}

// 创建服务器
module.exports = (req, res) => {
  handleRequest(req, res).catch(error => {
    console.error('未捕获的错误:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ detail: '服务器内部错误' }));
  });
};
