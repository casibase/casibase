# Casdoor Enforce 权限控制集成说明

## 🎯 功能概述

已成功将 Casdoor 的 Enforcer 权限验证功能集成到 casibase-med 中，实现基于角色的 URL 访问控制（RBAC）。

## 📁 修改的文件

### 1. `/home/baec/casibase-med/routers/authz_filter.go`
- 新增 `checkCasdoorPermission` 函数：调用 Casdoor Enforce API 进行权限验证
- 修改 `permissionFilter` 函数：集成权限检查逻辑
- 支持开关控制，可选择是否启用

### 2. `/home/baec/casibase-med/conf/app.conf`
- 添加配置项：
  ```ini
  enableCasdoorEnforce = false  # 是否启用 Casdoor 权限验证
  enforcerId = casibase/enforcer_l38pva  # 使用的 Enforcer ID
  ```

## 🔧 配置说明

### 基本配置

在 `conf/app.conf` 中设置：

```ini
# Casdoor Enforce 权限控制配置
enableCasdoorEnforce = true                # 设置为 true 启用权限验证
enforcerId = casibase/enforcer_l38pva     # 您的 Enforcer ID
```

### Enforcer 模型要求

您的 Enforcer 模型定义应该是：

```ini
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act, eft

[policy_effect]
e = some(where (p.eft == allow)) && !some(where (p.eft == deny))

[matchers]
m = (r.sub == p.sub || p.sub == "*") && (r.obj == p.obj || p.obj == "*") && (r.act == p.act || p.act == "*")
```

**关键点**：
- 请求格式：`[subject, object, action]`
- Matcher 支持通配符 `*`

## 📝 策略配置示例

### 1. 在 Casdoor 中添加策略

#### 允许 user 访问所有资源
```bash
curl --location --request POST \
'http://192.168.0.228:8000/api/add-policy?id=casibase/enforcer_l38pva' \
--header 'Content-Type: application/json' \
--header "Authorization: Basic $(echo -n '2c77bda6826252e55d3d:62f062b7dbd95cbc73e48076d08b5d53aa96914c' | base64)" \
--data-raw '{
  "ptype": "p",
  "v0": "user",
  "v1": "*",
  "v2": "*",
  "v3": "allow"
}'
```

#### 允许 user 访问特定资源
```bash
curl --location --request POST \
'http://192.168.0.228:8000/api/add-policy?id=casibase/enforcer_l38pva' \
--header 'Content-Type: application/json' \
--header "Authorization: Basic $(echo -n '2c77bda6826252e55d3d:62f062b7dbd95cbc73e48076d08b5d53aa96914c' | base64)" \
--data-raw '{
  "ptype": "p",
  "v0": "user",
  "v1": "/api/get-records",
  "v2": "GET",
  "v3": "allow"
}'
```

#### 拒绝 user 访问某些资源
```bash
curl --location --request POST \
'http://192.168.0.228:8000/api/add-policy?id=casibase/enforcer_l38pva' \
--header 'Content-Type: application/json' \
--header "Authorization: Basic $(echo -n '2c77bda6826252e55d3d:62f062b7dbd95cbc73e48076d08b5d53aa96914c' | base64)" \
--data-raw '{
  "ptype": "p",
  "v0": "user",
  "v1": "/api/delete-record",
  "v2": "POST",
  "v3": "deny"
}'
```

### 2. 策略字段说明

| 字段 | 说明 | 示例 |
|------|------|------|
| `ptype` | 策略类型 | `p` (policy) 或 `g` (group) |
| `v0` | Subject (主体) | `user`, `admin`, `*` |
| `v1` | Object (对象/资源) | `/api/get-records`, `*` |
| `v2` | Action (动作) | `GET`, `POST`, `*` |
| `v3` | Effect (效果) | `allow` 或 `deny` |

## 🚀 使用方法

### 步骤1: 更新 Enforcer 模型支持通配符

```bash
curl --location --request POST \
'http://192.168.0.228:8000/api/update-model?id=casibase/model_ylhdsi' \
--header 'Content-Type: application/json' \
--header "Authorization: Basic $(echo -n '2c77bda6826252e55d3d:62f062b7dbd95cbc73e48076d08b5d53aa96914c' | base64)" \
--data-raw '{
  "owner": "casibase",
  "name": "model_ylhdsi",
  "displayName": "RBAC Model with Wildcard",
  "modelText": "[request_definition]\nr = sub, obj, act\n\n[policy_definition]\np = sub, obj, act, eft\n\n[policy_effect]\ne = some(where (p.eft == allow)) && !some(where (p.eft == deny))\n\n[matchers]\nm = (r.sub == p.sub || p.sub == \"*\") && (r.obj == p.obj || p.obj == \"*\") && (r.act == p.act || p.act == \"*\")"
}'
```

### 步骤2: 添加基础策略

```bash
# 允许 user 访问 GET 请求
curl --location --request POST \
'http://192.168.0.228:8000/api/add-policy?id=casibase/enforcer_l38pva' \
--header 'Content-Type: application/json' \
--header "Authorization: Basic $(echo -n '2c77bda6826252e55d3d:62f062b7dbd95cbc73e48076d08b5d53aa96914c' | base64)" \
--data-raw '{
  "ptype": "p",
  "v0": "user",
  "v1": "/api/*",
  "v2": "GET",
  "v3": "allow"
}'

# 拒绝 user 的写操作
curl --location --request POST \
'http://192.168.0.228:8000/api/add-policy?id=casibase/enforcer_l38pva' \
--header 'Content-Type: application/json' \
--header "Authorization: Basic $(echo -n '2c77bda6826252e55d3d:62f062b7dbd95cbc73e48076d08b5d53aa96914c' | base64)" \
--data-raw '{
  "ptype": "p",
  "v0": "user",
  "v1": "/api/*",
  "v2": "POST",
  "v3": "deny"
}'
```

### 步骤3: 启用权限验证

修改 `conf/app.conf`：
```ini
enableCasdoorEnforce = true
```

### 步骤4: 重新编译和重启

```bash
cd /home/baec/casibase-med
go build -o casibase
pkill casibase
nohup ./casibase > casibase_log.txt 2>&1 &
```

## 🧪 测试

### 测试1: 验证策略是否生效

```bash
# 测试 Enforce API
curl --location --request POST \
'http://192.168.0.228:8000/api/enforce?enforcerId=casibase/enforcer_l38pva' \
--header 'Content-Type: application/json' \
--header "Authorization: Basic $(echo -n '2c77bda6826252e55d3d:62f062b7dbd95cbc73e48076d08b5d53aa96914c' | base64)" \
--data-raw '["user", "/api/get-records", "GET"]'

# 应该返回: {"status":"ok","data":[true],...}
```

### 测试2: 测试实际 API 访问

```bash
# 用户登录
curl -c cookies.txt --location --request POST \
'http://192.168.0.228:14000/api/signin' \
--header 'Content-Type: application/json' \
--data-raw '{
  "username": "user",
  "password": "123"
}'

# 访问允许的资源（应该成功）
curl -b cookies.txt --location --request GET \
'http://192.168.0.228:14000/api/get-records?owner=casibase'

# 访问拒绝的资源（应该失败）
curl -b cookies.txt --location --request POST \
'http://192.168.0.228:14000/api/add-record' \
--header 'Content-Type: application/json' \
--data-raw '{"owner":"casibase","name":"test"}'
```

## 📊 权限验证流程

```
用户请求 
  ↓
检查是否为公共接口（signin/signout）
  ↓ 否
获取用户身份（Session 或 BasicAuth）
  ↓
构造验证请求: [userId, path, method]
  ↓
调用 Casdoor Enforce API
  ↓
解析返回结果
  ↓
允许/拒绝访问
```

## ⚙️ 高级配置

### 1. 使用角色管理

```bash
# 添加角色定义
curl --location --request POST \
'http://192.168.0.228:8000/api/add-policy?id=casibase/enforcer_l38pva' \
--header 'Content-Type: application/json' \
--header "Authorization: Basic $(echo -n '2c77bda6826252e55d3d:62f062b7dbd95cbc73e48076d08b5d53aa96914c' | base64)" \
--data-raw '{
  "ptype": "g",
  "v0": "user",
  "v1": "viewer",
  "v2": ""
}'

# 为角色配置权限
curl --location --request POST \
'http://192.168.0.228:8000/api/add-policy?id=casibase/enforcer_l38pva' \
--header 'Content-Type: application/json' \
--header "Authorization: Basic $(echo -n '2c77bda6826252e55d3d:62f062b7dbd95cbc73e48076d08b5d53aa96914c' | base64)" \
--data-raw '{
  "ptype": "p",
  "v0": "viewer",
  "v1": "*",
  "v2": "GET",
  "v3": "allow"
}'
```

### 2. 多 Enforcer 支持

如果需要使用不同的 Enforcer：

```ini
# 在 app.conf 中配置
enforcerId = casibase/enforcer_production
```

### 3. 日志调试

查看权限验证日志：
```bash
tail -f /home/baec/casibase-med/logs/casibase.log | grep -i permission
```

## ⚠️ 注意事项

1. **免除检查的接口**：
   - `signin`, `signout`, `get-account`, `signup`, `login` 不进行权限检查

2. **用户ID格式**：
   - Session 用户使用 `user.Name`（如 `user`）
   - BasicAuth 使用完整 username（如 `app/casibase`）

3. **资源路径格式**：
   - 使用相对路径：`/api/get-records`
   - 不包含主机和端口

4. **HTTP 方法**：
   - 会转换为大写：`GET`, `POST`, `PUT`, `DELETE`

5. **通配符支持**：
   - 需要在 Model 的 matcher 中配置支持
   - 使用 `||` 运算符实现：`p.sub == "*"`

6. **性能考虑**：
   - 每次请求都会调用 Casdoor API
   - 可以考虑添加缓存机制

## 🔄 回退到原有权限系统

如果需要禁用 Casdoor Enforce：

```ini
# 在 app.conf 中设置
enableCasdoorEnforce = false
```

重启服务即可恢复原有的管理员权限检查逻辑。

## 📚 常见场景示例

### 场景1: 只允许查看，禁止修改
```bash
# 允许 GET
curl --location --request POST \
'http://192.168.0.228:8000/api/add-policy?id=casibase/enforcer_l38pva' \
--header 'Content-Type: application/json' \
--header "Authorization: Basic $(echo -n '2c77bda6826252e55d3d:62f062b7dbd95cbc73e48076d08b5d53aa96914c' | base64)" \
--data-raw '{"ptype":"p","v0":"user","v1":"*","v2":"GET","v3":"allow"}'

# 拒绝 POST/PUT/DELETE
curl --location --request POST \
'http://192.168.0.228:8000/api/add-policy?id=casibase/enforcer_l38pva' \
--header 'Content-Type: application/json' \
--header "Authorization: Basic $(echo -n '2c77bda6826252e55d3d:62f062b7dbd95cbc73e48076d08b5d53aa96914c' | base64)" \
--data-raw '{"ptype":"p","v0":"user","v1":"*","v2":"POST","v3":"deny"}'
```

### 场景2: 特定资源的细粒度控制
```bash
# 允许访问 records
curl --location --request POST \
'http://192.168.0.228:8000/api/add-policy?id=casibase/enforcer_l38pva' \
--header 'Content-Type: application/json' \
--header "Authorization: Basic $(echo -n '2c77bda6826252e55d3d:62f062b7dbd95cbc73e48076d08b5d53aa96914c' | base64)" \
--data-raw '{"ptype":"p","v0":"user","v1":"/api/*-record*","v2":"*","v3":"allow"}'

# 拒绝访问 admin 相关接口
curl --location --request POST \
'http://192.168.0.228:8000/api/add-policy?id=casibase/enforcer_l38pva' \
--header 'Content-Type: application/json' \
--header "Authorization: Basic $(echo -n '2c77bda6826252e55d3d:62f062b7dbd95cbc73e48076d08b5d53aa96914c' | base64)" \
--data-raw '{"ptype":"p","v0":"user","v1":"/api/admin/*","v2":"*","v3":"deny"}'
```

## 🛠️ 故障排查

### 问题1: 返回 "Permission denied"

**排查步骤**：
1. 检查策略是否存在
2. 确认用户ID格式正确
3. 验证资源路径匹配
4. 查看日志了解详细信息

### 问题2: Enforce API 调用失败

**可能原因**：
- Casdoor 服务不可用
- clientId/clientSecret 错误
- enforcerId 配置错误

**解决方法**：
- 检查配置文件
- 测试 Casdoor 连接
- 查看错误日志

### 问题3: 所有请求都被拒绝

**检查清单**：
- [ ] `enableCasdoorEnforce = true`
- [ ] Enforcer 中有匹配的策略
- [ ] Model 的 matcher 配置正确
- [ ] 策略的 effect 是 `allow`

## 📞 支持

如有问题，请查看：
- 应用日志：`/home/baec/casibase-med/logs/casibase.log`
- Casdoor 日志：`/home/baec/casdoor/logs/casdoor.log`

---

**创建时间**: 2025-10-07  
**版本**: v1.0

