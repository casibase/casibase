# 多中心科研页面权限配置说明

## 📋 功能概述

本文档说明如何配置 `/multi-center` 页面的访问权限控制。当用户没有访问权限时，系统会自动重定向到首页并显示友好的提示信息。

## 🏗️ 实现架构

采用**前后端混合权限验证**方案：

1. **后端部分**：
   - 新增 API: `/api/check-page-permission` 用于检查页面访问权限
   - 复用 Casdoor Enforce 权限检查逻辑
   - 支持 `enableCasdoorEnforce` 开关控制

2. **前端部分**：
   - 使用 HOC (Higher-Order Component) 包装需要权限保护的页面
   - 在路由加载前异步检查权限
   - 无权限时自动重定向到首页并显示提示

## 🔧 配置步骤

### 1. 启用 Casdoor Enforce 权限验证

在 `conf/app.conf` 中确保启用了 Casdoor 权限验证：

```ini
enableCasdoorEnforce = true
enforcerId = "casibase/enforcer_l38pva"
```

### 2. 在 Casdoor 中配置权限策略

#### 2.1 登录 Casdoor 管理后台

访问您的 Casdoor 管理后台（通常是 `http://your-casdoor-domain`）

#### 2.2 配置 Enforcer 模型

确保 Enforcer 的模型定义为：

```
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act
```

#### 2.3 添加权限策略

在 Casdoor 的 Enforcer 策略中添加以下规则：

**允许特定用户访问多中心科研页面：**
```
p, <username>, /multi-center, GET
```

**允许管理员访问：**
```
p, admin, /multi-center, GET
```

**通配符示例（允许所有用户访问）：**
```
p, *, /multi-center, GET
```

**角色-based访问控制示例：**
```
# 假设有 researcher 角色
p, role:researcher, /multi-center, GET

# 为用户分配角色
g, alice, role:researcher
g, bob, role:researcher
```

### 3. 重启服务

修改配置后需要重启 Casibase 服务：

```bash
# 停止服务
./casibase stop

# 启动服务
./casibase start
```

## 📝 使用说明

### 已保护的路由

以下路由已添加权限保护：

1. `/multi-center` - 多中心科研主页
2. `/multi-center/data-workbench` - 数据工作台
3. `/multi-center/audit-log` - 数据审计记录

**注意**：所有子路由都使用主路由 `/multi-center` 的权限策略。

### 用户体验流程

1. **有权限的用户**：
   - 直接访问页面
   - 显示"正在检查权限..."加载提示（通常很快）
   - 成功加载页面内容

2. **无权限的用户**：
   - 显示"正在检查权限..."
   - 弹出错误提示："您没有访问此页面的权限"
   - 1秒后自动重定向到首页

3. **未登录用户**：
   - 首先会被重定向到登录页面（由 `renderSigninIfNotSignedIn` 处理）
   - 登录后再进行权限检查

## 🎯 扩展到其他页面

如果需要为其他页面添加类似的权限控制，可以按照以下步骤操作：

### 1. 在 App.js 中修改路由

```javascript
// 导入 HOC
import withPagePermission from "./components/PagePermissionGuard";

// 修改路由
<Route exact path="/your-page" render={(props) => {
  const YourPageWithPermission = withPagePermission(YourPageComponent, "/your-page");
  return this.renderSigninIfNotSignedIn(<YourPageWithPermission account={this.state.account} {...props} />);
}} />
```

### 2. 在 Casdoor 中添加对应的策略

```
p, <username>, /your-page, GET
```

## 🔍 故障排查

### 1. 权限检查失败

**症状**：所有用户都无法访问页面

**可能原因**：
- `enableCasdoorEnforce` 未启用
- Casdoor Enforce API 连接失败
- `enforcerId` 配置错误

**解决方案**：
```bash
# 查看后端日志
tail -f logs/casibase.log | grep "Permission"

# 检查 Casdoor 连接
curl -X POST "http://your-casdoor/api/enforce?enforcerId=casibase/enforcer_l38pva" \
  -u "clientId:clientSecret" \
  -H "Content-Type: application/json" \
  -d '["testuser", "/multi-center", "GET"]'
```

### 2. 策略不生效

**症状**：添加了策略但用户仍无法访问

**检查项**：
1. 策略中的用户名是否正确（注意：使用 `user.Name`，不是 `owner/name` 格式）
2. 路径是否完全匹配（区分大小写）
3. HTTP 方法是否为 `GET`

### 3. 前端一直显示加载中

**症状**：页面停留在"正在检查权限..."

**可能原因**：
- 后端 API 无响应
- 网络错误
- 前端请求超时

**解决方案**：
```javascript
// 在浏览器控制台检查
fetch('/api/check-page-permission?pagePath=/multi-center', {
  credentials: 'include'
}).then(r => r.json()).then(console.log);
```

## 📊 测试建议

### 1. 创建测试用户

在 Casdoor 中创建几个测试用户：
- `test_allowed` - 有权限访问
- `test_denied` - 无权限访问
- `test_admin` - 管理员

### 2. 配置测试策略

```
p, test_allowed, /multi-center, GET
p, admin, /multi-center, GET
```

### 3. 测试场景

| 用户 | 预期结果 |
|------|---------|
| test_allowed | ✅ 成功访问 |
| test_denied | ❌ 重定向到首页 + 提示 |
| test_admin | ✅ 成功访问 |
| 未登录 | 🔐 重定向到登录页 |

## 🔐 安全最佳实践

1. **最小权限原则**：只给需要的用户授予访问权限
2. **定期审计**：定期检查权限策略，移除不再需要的规则
3. **分组管理**：使用角色（role）而不是直接给用户授权
4. **日志监控**：监控后端日志中的权限检查记录

## 📚 相关文件

### 后端代码
- `routers/authz_filter.go` - 权限检查核心逻辑
- `controllers/permission.go` - 页面权限检查 API
- `routers/router.go` - API 路由注册

### 前端代码
- `web/src/components/PagePermissionGuard.js` - 权限守卫 HOC
- `web/src/backend/PagePermissionBackend.js` - API 调用封装
- `web/src/App.js` - 路由配置
- `web/src/locales/zh/data.json` - 中文翻译
- `web/src/locales/en/data.json` - 英文翻译

## 💡 技术细节

### API 接口

**请求**：
```
GET /api/check-page-permission?pagePath=/multi-center
```

**响应（有权限）**：
```json
{
  "status": "ok",
  "msg": "",
  "data": {
    "allowed": true,
    "userId": "alice",
    "pagePath": "/multi-center"
  }
}
```

**响应（无权限）**：
```json
{
  "status": "ok",
  "msg": "",
  "data": {
    "allowed": false,
    "userId": "bob",
    "pagePath": "/multi-center"
  }
}
```

### 权限检查流程

```
用户访问 /multi-center
    ↓
renderSigninIfNotSignedIn (检查登录状态)
    ↓
withPagePermission HOC (检查页面权限)
    ↓
调用 /api/check-page-permission
    ↓
后端调用 routers.CheckPagePermission
    ↓
调用 checkCasdoorPermission (Casdoor Enforce API)
    ↓
返回权限检查结果
    ↓
前端根据结果决定：渲染页面 或 重定向到首页
```

## 📞 技术支持

如有问题，请：
1. 查看后端日志：`logs/casibase.log`
2. 检查浏览器控制台错误
3. 验证 Casdoor 配置
4. 联系系统管理员

---

**版本**: 1.0  
**更新日期**: 2025-10-14  
**作者**: Casibase Team


