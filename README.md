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
    GithubAuthState = "xx" //set by yourself, we may change this to a random word in the future
    ```

    You may also have to fill in the **same** information at: https://github.com/casbin/casbin-forum/blob/master/web/src/Conf.js. By the way, you could change the value of `scope` to get different user information form them if you need, we just take `profile` and `email`.

    ```javascript
    export const GoogleClientId  = "xxx"

    export const GoogleAuthState  = "xxx"

    export const GoogleAuthScope  = "profile+email"

    export const GithubClientId  = "xxx"

    export const GithubAuthState  = "xxx"

    export const GithubAuthScope  = "user:email+read:user"
    ```

  3. QQ
  
        Before you begin to use QQ login services, you should make sure that you have applied the application at [QQ-connect](https://connect.qq.com/manage.html#/)

    Configuration:

    ```javascript
    export const QQClientId  = ""
  
    export const QQAuthState  = ""
  
    export const QQAuthScope  = "get_user_info"
  
    export const QQOauthUri = "https://graph.qq.com/oauth2.0/authorize"
    ```

    ```ini
    QQAPPID = ""
    QQAPPKey = ""
    QQAuthState = ""
    ```

    We would show different login/signup methods depending on your configuration.

- OSS, Mail, and SMS services.

   We use Ali OSS, Ali Mail, and Ali SMS to save the user's pictures, send emails to users and send short messages to users.

   **You could use another OSS, Mail, and SMS services**, we separate those functions from main code, you could found those functions at https://github.com/casbin/casbin-forum/tree/master/service

   We would mainly use Ali services for example in the next.

   Information in Conf.js

   ```javascript
  export const OSSRegion = "" //your oss region

  //The endpoint of your oss region, find it on https://help.aliyun.com/document_detail/31837.html
  export const OSSEndPoint = "" //your oss end point

  export const OSSBucket = "" //your oss bucket

  //The path stored in your oss
  //eg: `casbin-forum` or `casbin/forum/xxx/xxx`
  export const OSSBasicPath = "" //prefix for saved pictures 
  
  //If you set a custom domain name in ali-oss bucket, please fill in.
  export const OSSCustomDomain = ""
  ```

  Information in app.conf.
  You could get your roleArn in https://ram.console.aliyun.com/roles.
  Before that, you should have an independent account for this application, and add corresponding permissions.
  Such as:
  ```
  {
      "Statement": [
          {
              "Effect": "Allow",
              "Action": [
                  "oss:PutObject",
                  "oss:GetObject",
                  "oss:AbortMultipartUpload",
                  "oss:DeleteObject"
              ],
              "Resource": [
                  "acs:oss:*:*:yourbucket",
                  "acs:oss:*:*:yourbucket/*"
              ]
          }
      ],
      "Version": "1"
  }
  ```  
  By the way, you should set your bucket permissions to public read.

  ```ini
  accessKeyID     = ""
  accessKeySecret = ""
  roleArn         = ""
  OSSCustomDomain = ""
  OSSBasicPath = ""
  OSSRegion = ""
  OSSEndPoint = ""
  OSSBucket = ""
  SMSSignName = ""
  SMSTemplateCode = ""
  mailUser = ""
  mailPass = ""
  mailHost = ""
  mailPort = ""
  ```

- Github corner

    We added a Github icon in the upper right corner, linking to your Github repository address.
    You could set `ShowGithubCorner` to hidden it.

    Configuration:

    ```javascript
  export const ShowGithubCorner = true

  export const GithubRepo = "https://github.com/casbin/casbin-forum" //your github repository
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
