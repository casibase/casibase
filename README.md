Casbin-forum
====

Casbin-forum is the official forum for Casbin developers and users. 

## Link

https://forum.casbin.org/

## Architecture

Casbin-forum contains 2 parts:

Name | Description | Language | Source code
----|------|----|----
Frontend | Web frontend UI for Casbin-forum | Javascript + React | https://github.com/casbin/casbin-forum/tree/master/web 
Backend | RESTful API backend for Casbin-forum | Golang + Beego + MySQL | https://github.com/casbin/casbin-forum 

## Installation

- Get the code:

```shell
go get github.com/casbin/casbin-forum
```

- Setup database:

Casbin-forum will store its users, nodes and topics informations in a MySQL database named: `casbin_forum`, will create it if not existed. The DB connection string can be specified at: https://github.com/casbin/casbin-forum/blob/master/conf/app.conf

```ini
dataSourceName = root:123@tcp(localhost:3306)/
```

Casbin-forum uses XORM to connect to DB, so all DBs supported by XORM can also be used.

- Setup your forum :

Casbin-forum provide a way to sign up using Google account,  so you may have to get your own  ClientID and ClientSecret first. You could get them by clicking on this url: https://console.developers.google.com/apis

And to improve security, you could set a `state` value to make sure the request is requesting by yourself.

Those information strings can be specified at: https://github.com/casbin/casbin-forum/blob/master/conf/app.conf

```ini
ClientID = ""
ClientSecret = ""
state = ""
```

You may also have to fill in the same informations at: https://github.com/casbin/casbin-forum/blob/master/web/src/main/SignupBox.js. By the way, you could change the value of `scope` to get different user informations form Google if you need.

```javascript
clientId: "",
oauthUri: "",
state: "",
scope: "https://www.googleapis.com/auth/userinfo.profile+https://www.googleapis.com/auth/userinfo.email",
```

- Run backend (in port 7000):

```shell
go run main.go
```

- Run frontend (in the same machine's port 3000):

```shell
cd web
npm install
npm run start
```

- Open browser:

http://localhost:3000/
    