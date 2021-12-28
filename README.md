<h1 align="center" style="border-bottom: none;">📦⚡️ Casnode</h1>
<h3 align="center">An open-source forum (BBS) software developed by Go and React.</h3>
<p align="center">
  <a href="#badge">
    <img alt="semantic-release" src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg">
  </a>
  <a href="https://hub.docker.com/r/casbin/casnode">
    <img alt="docker pull casbin/casnode" src="https://img.shields.io/docker/pulls/casbin/casnode.svg">
  </a>
  <a href="https://github.com/casbin/casnode/actions/workflows/build.yml">
    <img alt="GitHub Workflow Status (branch)" src="https://github.com/casbin/jcasbin/workflows/build/badge.svg?style=flat-square">
  </a>
  <a href="https://github.com/casbin/casnode/releases/latest">
    <img alt="GitHub Release" src="https://img.shields.io/github/v/release/casbin/casnode.svg">
  </a>
  <a href="https://hub.docker.com/repository/docker/casbin/casnode">
    <img alt="Docker Image Version (latest semver)" src="https://img.shields.io/badge/Docker%20Hub-latest-brightgreen">
  </a>
</p>

<p align="center">
  <a href="https://goreportcard.com/report/github.com/casbin/casnode">
    <img alt="Go Report Card" src="https://goreportcard.com/badge/github.com/casbin/casnode?style=flat-square">
  </a>
  <a href="https://github.com/casbin/casnode/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/casbin/casnode?style=flat-square" alt="license">
  </a>
  <a href="https://github.com/casbin/casnode/issues">
    <img alt="GitHub issues" src="https://img.shields.io/github/issues/casbin/casnode?style=flat-square">
  </a>
  <a href="#">
    <img alt="GitHub stars" src="https://img.shields.io/github/stars/casbin/casnode?style=flat-square">
  </a>
  <a href="https://github.com/casbin/casnode/network">
    <img alt="GitHub forks" src="https://img.shields.io/github/forks/casbin/casnode?style=flat-square">
  </a>
  <a href="https://crowdin.com/project/casnode">
    <img alt="Crowdin" src="https://badges.crowdin.net/casnode/localized.svg">
  </a>
</p>

## Online demo

Deployed site: https://forum.casbin.com/

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
go get github.com/casdoor/casdoor
```
or
```shell
git clone https://github.com/casbin/casnode
git clone https://github.com/casdoor/casdoor
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

  Casnode uses Casdoor to upload files to cloud storage, send Emails and send SMSs. See Casdoor for more details.

#### Github corner

We added a Github icon in the upper right corner, linking to your Github repository address.
You could set `ShowGithubCorner` to hidden it.

Configuration:

```javascript
export const ShowGithubCorner = true

export const GithubRepo = "https://github.com/casbin/casnode" //your github repository
```