Casbin-forum
====

Casbin-forum is the official forum for Casbin developers and users. 

## Link

https://forum.casbin.com/

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

- Setup your forum to enable some third-party login platform:

Casbin-forum provide a way to sign up using Google account, Github account, WeChat account and so on,  so you may have to get your own  ClientID and ClientSecret first.

1. Google

    You could get them by clicking on this url: https://console.developers.google.com/apis
    You should set `Authorized JavaScript origins` to fit your own domain address, for local testing, set`http://localhost:3000`. And set the `Authorized redirect URIs`, the same domain address as before, add `/callback/google/signup` and `/callback/google/link` after that, for local testing, set`http://localhost:3000/callback/google/signup` + `http://localhost:3000/callback/google/link`.

2. Github

    You could get them by clicking on this url: https://github.com/settings/developers
    You should set `Homepage URL` to fit your own domain address, for local testing, set`http://localhost:3000`. And set the `Authorization callback URL`, the same domain address as before, add `/callback/github` after that, for local testing, set`http://localhost:3000/callback/github`.

And to improve security, you could set a `state` value determined by **yourself** to make sure the request is requesting by yourself, such as "random".
Those information strings can be specified at: https://github.com/casbin/casbin-forum/blob/master/conf/app.conf

```ini
GoogleAuthClientID = "xxx" //your own client id
GoogleAuthClientSecret = "xxx" //your own client secret
GoogleAuthState = "xxx" //set by yourself
GithubAuthClientID = "xxx" //your own client id
GithubAuthClientSecret = "xxx" //your own client secret
GithubAuthState = "xx" //set by yourself
```

You may also have to fill in the **same** informations at: https://github.com/casbin/casbin-forum/blob/master/web/src/Conf.js. By the way, you could change the value of `scope` to get different user information form them if you need, we just take `profile` and `email`.

```javascript
export const GoogleClientId  = "xxx"

export const GoogleAuthState  = "xxx"

export const GoogleAuthScope  = "profile+email"

export const GithubClientId  = "xxx"

export const GithubAuthState  = "xxx"

export const GithubAuthScope  = "user:email+read:user"
```

- Fill in your Ali OSS configuration information

    We use Ali OSS to save the user's pictures.
    
   Informations in Conf.js
    ```javascript
  export const OSSRegion = "" //your oss region
  
  //The endpoint of your oss region, find it on https://help.aliyun.com/document_detail/31837.html
  export const OSSEndPoint = "" //your oss end point
  
  export const OSSBucket = "" //your oss bucket
  
  //The path stored in your oss
  //eg: `casbin-forum` or `casbin/forum/xxx/xxx`
  export const OSSBasicPath = "" //prefix for saved pictures 
    ```
  Informations in app.conf.
  You could get your roleArn in https://ram.console.aliyun.com/roles.
  Before that, you should have a independent account for this application, and add `AliyunOSSFullAccess`.
  By the way, you should set your bucket permissions to public read.
    ```ini
  accessKeyID     = ""
  accessKeySecret = ""
  roleArn         = ""
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
    