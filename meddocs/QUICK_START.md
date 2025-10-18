# 🚀 Casdoor 权限控制快速开始

## 5分钟快速配置

### 第1步: 更新 Enforcer 模型（支持通配符）

```bash
curl --location --request POST \
'http://192.168.0.228:8000/api/update-model?id=casibase/model_ylhdsi' \
--header 'Content-Type: application/json' \
--user '2c77bda6826252e55d3d:62f062b7dbd95cbc73e48076d08b5d53aa96914c' \
--data-raw '{
  "owner": "casibase",
  "name": "model_ylhdsi",
  "displayName": "RBAC Model",
  "modelText": "[request_definition]\nr = sub, obj, act\n\n[policy_definition]\np = sub, obj, act, eft\n\n[policy_effect]\ne = some(where (p.eft == allow)) && !some(where (p.eft == deny))\n\n[matchers]\nm = (r.sub == p.sub || p.sub == \"*\") && (r.obj == p.obj || p.obj == \"*\") && (r.act == p.act || p.act == \"*\")"
}'
```

### 第2步: 添加权限策略

#### 方案A: 允许 user 访问所有资源（测试用）
```bash
curl --location --request POST \
'http://192.168.0.228:8000/api/add-policy?id=casibase/enforcer_l38pva' \
--header 'Content-Type: application/json' \
--user '2c77bda6826252e55d3d:62f062b7dbd95cbc73e48076d08b5d53aa96914c' \
--data-raw '{"ptype":"p","v0":"user","v1":"*","v2":"*","v3":"allow"}'
```

#### 方案B: 只允许查看，禁止修改（生产推荐）
```bash
# 允许 GET 请求
curl --location --request POST \
'http://192.168.0.228:8000/api/add-policy?id=casibase/enforcer_l38pva' \
--header 'Content-Type: application/json' \
--user '2c77bda6826252e55d3d:62f062b7dbd95cbc73e48076d08b5d53aa96914c' \
--data-raw '{"ptype":"p","v0":"user","v1":"*","v2":"GET","v3":"allow"}'

# 拒绝 POST/PUT/DELETE
curl --location --request POST \
'http://192.168.0.228:8000/api/add-policy?id=casibase/enforcer_l38pva' \
--header 'Content-Type: application/json' \
--user '2c77bda6826252e55d3d:62f062b7dbd95cbc73e48076d08b5d53aa96914c' \
--data-raw '{"ptype":"p","v0":"user","v1":"*","v2":"POST","v3":"deny"}'
```

### 第3步: 测试策略

```bash
# 测试 GET 请求（应该返回 true）
curl --location --request POST \
'http://192.168.0.228:8000/api/enforce?enforcerId=casibase/enforcer_l38pva' \
--header 'Content-Type: application/json' \
--user '2c77bda6826252e55d3d:62f062b7dbd95cbc73e48076d08b5d53aa96914c' \
--data-raw '["user", "/api/get-records", "GET"]'

# 测试 POST 请求（方案B应该返回 false）
curl --location --request POST \
'http://192.168.0.228:8000/api/enforce?enforcerId=casibase/enforcer_l38pva' \
--header 'Content-Type: application/json' \
--user '2c77bda6826252e55d3d:62f062b7dbd95cbc73e48076d08b5d53aa96914c' \
--data-raw '["user", "/api/add-record", "POST"]'
```

### 第4步: 启用权限验证

编辑 `/home/baec/casibase-med/conf/app.conf`：
```ini
enableCasdoorEnforce = true
```

### 第5步: 重启服务

```bash
cd /home/baec/casibase-med
go build -o casibase
pkill casibase
nohup ./casibase > casibase_log.txt 2>&1 &
```

## ✅ 验证效果

### 测试1: 用户登录后访问

```bash
# 登录
curl -c cookies.txt --location --request POST \
'http://192.168.0.228:14000/api/signin' \
--header 'Content-Type: application/json' \
--data-raw '{"username":"user","password":"123"}'

# 测试允许的操作（GET）
curl -b cookies.txt 'http://192.168.0.228:14000/api/get-records?owner=casibase'
# ✅ 应该成功

# 测试拒绝的操作（POST）- 仅方案B
curl -b cookies.txt --location --request POST \
'http://192.168.0.228:14000/api/add-record' \
--header 'Content-Type: application/json' \
--data-raw '{"owner":"casibase","name":"test"}'
# ❌ 应该返回: "Permission denied: You don't have access to this resource"
```

## 📋 常用策略模板

### 1. 只读用户
```bash
curl --location --request POST \
'http://192.168.0.228:8000/api/add-policy?id=casibase/enforcer_l38pva' \
--header 'Content-Type: application/json' \
--user '2c77bda6826252e55d3d:62f062b7dbd95cbc73e48076d08b5d53aa96914c' \
--data-raw '{"ptype":"p","v0":"viewer","v1":"*","v2":"GET","v3":"allow"}'
```

### 2. 编辑用户
```bash
curl --location --request POST \
'http://192.168.0.228:8000/api/add-policy?id=casibase/enforcer_l38pva' \
--header 'Content-Type: application/json' \
--user '2c77bda6826252e55d3d:62f062b7dbd95cbc73e48076d08b5d53aa96914c' \
--data-raw '{"ptype":"p","v0":"editor","v1":"*","v2":"*","v3":"allow"}'
```

### 3. 限制特定资源
```bash
# 只允许访问 records
curl --location --request POST \
'http://192.168.0.228:8000/api/add-policy?id=casibase/enforcer_l38pva' \
--header 'Content-Type: application/json' \
--user '2c77bda6826252e55d3d:62f062b7dbd95cbc73e48076d08b5d53aa96914c' \
--data-raw '{"ptype":"p","v0":"user","v1":"/api/*-record*","v2":"*","v3":"allow"}'
```

## 🔧 查看当前策略

```bash
curl --location --request GET \
'http://192.168.0.228:8000/api/get-policies?id=casibase/enforcer_l38pva' \
--user '2c77bda6826252e55d3d:62f062b7dbd95cbc73e48076d08b5d53aa96914c'
```

## 🗑️ 删除策略

```bash
curl --location --request POST \
'http://192.168.0.228:8000/api/remove-policy?id=casibase/enforcer_l38pva' \
--header 'Content-Type: application/json' \
--user '2c77bda6826252e55d3d:62f062b7dbd95cbc73e48076d08b5d53aa96914c' \
--data-raw '{"ptype":"p","v0":"user","v1":"*","v2":"*"}'
```

## 📝 查看日志

```bash
# 实时查看权限验证日志
tail -f /home/baec/casibase-med/logs/casibase.log | grep -i permission
```

## ⚠️ 紧急回退

如果出现问题，立即禁用：
```bash
# 编辑配置文件
vim /home/baec/casibase-med/conf/app.conf
# 设置: enableCasdoorEnforce = false

# 重启服务
cd /home/baec/casibase-med
pkill casibase
./casibase &
```

---

更多详细信息请参考：[CASDOOR_ENFORCE_配置说明.md](CASDOOR_ENFORCE_配置说明.md)

