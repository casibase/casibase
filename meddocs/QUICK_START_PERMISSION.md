# 多中心页面权限控制 - 快速开始

## ✅ 已完成的修改

### 后端修改（3个文件）

1. **routers/authz_filter.go**
   - ✅ 新增 `CheckPagePermission()` 函数，用于检查页面访问权限

2. **controllers/permission.go**
   - ✅ 新增 `CheckPagePermission()` API 处理器
   - ✅ 添加了对 `routers` 包的导入

3. **routers/router.go**
   - ✅ 注册新的 API 路由：`/api/check-page-permission`

### 前端修改（5个文件）

4. **web/src/backend/PagePermissionBackend.js** (新建)
   - ✅ 封装页面权限检查 API 调用

5. **web/src/components/PagePermissionGuard.js** (新建)
   - ✅ 创建权限守卫 HOC 组件
   - ✅ 实现权限检查、加载提示、重定向逻辑

6. **web/src/App.js**
   - ✅ 导入 `withPagePermission` HOC
   - ✅ 修改 3 个多中心相关路由，添加权限保护

7. **web/src/locales/zh/data.json**
   - ✅ 添加中文翻译文本

8. **web/src/locales/en/data.json**
   - ✅ 添加英文翻译文本

## 🚀 快速配置（3步）

### 第1步：启用权限验证

在 `conf/app.conf` 中确认配置：

```ini
enableCasdoorEnforce = true
enforcerId = "casibase/enforcer_l38pva"
```

### 第2步：在 Casdoor 中添加策略

登录 Casdoor 管理后台，在对应的 Enforcer 中添加策略：

```
# 允许特定用户访问
p, alice, /multi-center, GET
p, bob, /multi-center, GET

# 或者允许所有用户访问
p, *, /multi-center, GET
```

### 第3步：重启服务并测试

```bash
# 重启后端服务
./casibase

# 在浏览器中测试
# 1. 以有权限的用户登录
# 2. 访问 http://localhost:14000/multi-center
# 3. 应该能正常访问

# 4. 以无权限的用户登录
# 5. 访问 http://localhost:14000/multi-center
# 6. 应该看到"您没有访问此页面的权限"提示，并重定向到首页
```

## 📋 测试清单

- [ ] 有权限的用户可以正常访问 `/multi-center`
- [ ] 无权限的用户会看到错误提示并重定向到首页
- [ ] 未登录用户会先跳转到登录页
- [ ] 页面加载时显示"正在检查权限..."提示
- [ ] 多中心的三个页面都受保护：
  - [ ] `/multi-center`
  - [ ] `/multi-center/data-workbench`
  - [ ] `/multi-center/audit-log`

## 🎯 关键特性

### ✨ 用户体验
- 🔒 **安全**：前后端双重验证
- ⚡ **快速**：权限检查异步进行，不影响整体加载速度
- 🎨 **友好**：加载动画 + 友好的错误提示
- 🔄 **自动重定向**：无权限自动跳转到首页

### 🛡️ 安全设计
- 后端权限检查无法绕过（即使前端被篡改）
- 支持 Casdoor Enforce 策略引擎
- 可配置是否启用权限验证
- 详细的权限检查日志

### 🔧 扩展性
- 易于扩展到其他页面
- HOC 模式，代码复用性强
- 支持国际化（中英文）

## 📦 代码示例

### 为其他页面添加权限保护

只需在 `App.js` 中这样修改：

```javascript
// 1. 导入 HOC（已完成）
import withPagePermission from "./components/PagePermissionGuard";

// 2. 修改路由
<Route exact path="/your-page" render={(props) => {
  const YourPageWithPermission = withPagePermission(YourPageComponent, "/your-page");
  return this.renderSigninIfNotSignedIn(<YourPageWithPermission account={this.state.account} {...props} />);
}} />

// 3. 在 Casdoor 中添加策略
// p, <username>, /your-page, GET
```

## 🔍 故障排查

### 问题1：所有用户都无法访问

**原因**：可能没有配置任何策略

**解决**：在 Casdoor 中添加至少一条策略
```
p, *, /multi-center, GET
```

### 问题2：策略不生效

**检查**：
1. 用户名是否正确（使用 `user.Name`）
2. 路径是否完全匹配（`/multi-center`）
3. HTTP 方法是否为 `GET`

**调试**：查看后端日志
```bash
tail -f logs/casibase.log | grep "Permission"
```

### 问题3：页面一直加载

**原因**：后端 API 可能无响应

**调试**：在浏览器控制台执行
```javascript
fetch('/api/check-page-permission?pagePath=/multi-center', {
  credentials: 'include'
}).then(r => r.json()).then(console.log);
```

## 📚 相关文档

- 详细配置文档：[MULTI_CENTER_PERMISSION_CONFIG.md](./MULTI_CENTER_PERMISSION_CONFIG.md)
- Casdoor 配置说明：[CASDOOR_ENFORCE_配置说明.md](./CASDOOR_ENFORCE_配置说明.md)

## 💬 示例策略配置

### 基于用户的权限

```
# 允许特定用户
p, alice, /multi-center, GET
p, bob, /multi-center, GET
p, admin, /multi-center, GET
```

### 基于角色的权限

```
# 定义角色权限
p, role:researcher, /multi-center, GET
p, role:admin, /multi-center, GET

# 为用户分配角色
g, alice, role:researcher
g, bob, role:researcher
g, admin, role:admin
```

### 通配符权限

```
# 允许所有用户（用于测试）
p, *, /multi-center, GET
```

## ✅ 验证成功的标志

当配置成功后，您应该看到：

1. **有权限用户访问时**：
   - 短暂显示"正在检查权限..."
   - 成功加载页面内容

2. **无权限用户访问时**：
   - 显示红色错误提示："您没有访问此页面的权限"
   - 1秒后自动跳转到首页

3. **后端日志**：
   ```
   Permission granted for user=alice, path=/multi-center, method=GET
   ```
   或
   ```
   Permission denied for user=bob, path=/multi-center, method=GET by Casdoor policy
   ```

## 🎉 完成！

现在您的多中心页面已经受到完整的权限保护了！

如有问题，请查看详细配置文档或联系技术支持。


