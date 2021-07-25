Casnode
====

Casnode is the official forum for Casbin developers and users. 

## Link

https://forum.casbin.com/

## Architecture

Casnode contains 2 parts:

Name | Description | Language | Source code
----|------|----|----
Frontend | Web frontend UI for Casnode | Javascript + React | https://github.com/casbin/casnode/tree/master/web 
Backend | RESTful API backend for Casnode | Golang + Beego + MySQL | https://github.com/casbin/casnode 

## Installation
Casnode uses Casdoor to manage members. So you need to create an organization and an application for Casnode in a Casdoor instance.
### Necessary configuration 

#### Get the code

```shell
go get github.com/casbin/casnode
go get github.com/casbin/casdoor
```
or
```shell
git clone https://github.com/casbin/casnode
git clone https://github.com/casbin/casdoor
```

#### Setup database

Casnode will store its users, nodes and topics informations in a MySQL database named: `casnode`, will create it if not existed. The DB connection string can be specified at: https://github.com/casbin/casnode/blob/master/conf/app.conf

```ini
dataSourceName = root:123@tcp(localhost:3306)/
```

Casnode uses XORM to connect to DB, so all DBs supported by XORM can also be used.

#### Run casnode
  - Configure and run casnode by yourself. If you want to learn more about casnode, you see [casnode installation](https://casnode.org/docs/installation).
  - Install casnode using docker. you see [installation by docker](https://casnode.org/docs/Docker).
  - Install casnode using BTpanel. you see [installation by BTpanel](https://casnode.org/docs/BTpanel).
  - Open browser:

    http://localhost:3000/

### Optional configuration 

#### Setup your forum to enable some third-party login platform

  Casnode uses Casdoor to manage members. If you want to log in with oauth, you should see [casdoor oauth configuration](https://casdoor.org/docs/provider/OAuth).

#### OSS, Mail, and SMS services

   We use Ali OSS, Ali Mail, and Ali SMS to save the user's pictures, send emails to users and send short messages to users.

   **You could use another OSS, Mail, and SMS services**, we separate those functions from main code, you could found those functions at https://github.com/casbin/casnode/tree/master/service

   We would mainly use Ali services for example in the next.

   Information in Conf.js

   ```javascript
  export const OSSRegion = "" //your oss region

  //The endpoint of your oss region, find it on https://help.aliyun.com/document_detail/31837.html
  export const OSSEndPoint = "" //your oss end point

  export const OSSBucket = "" //your oss bucket

  //The path stored in your oss
  //eg: `casnode` or `casbin/forum/xxx/xxx`
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
  mailUser = ""
  mailPass = ""
  mailHost = ""
  mailPort = ""
  ```

#### Github corner

We added a Github icon in the upper right corner, linking to your Github repository address.
You could set `ShowGithubCorner` to hidden it.

Configuration:

```javascript
export const ShowGithubCorner = true

export const GithubRepo = "https://github.com/casbin/casnode" //your github repository
```