<h1 align="center" style="border-bottom: none;">📦⚡️ Casibase</h1>
<h3 align="center">A pioneering customizable open-source Domain Knowledge Base (DKB)
    powered by ChatGPT, Casbin, and Casdoor.</h3>
<p align="center">
  <a href="#badge">
    <img alt="semantic-release" src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg">
  </a>
  <a href="https://hub.docker.com/r/casbin/casibase">
    <img alt="docker pull casbin/casibase" src="https://img.shields.io/docker/pulls/casbin/casibase.svg">
  </a>
  <a href="https://github.com/casbin/casibase/actions/workflows/build.yml">
    <img alt="GitHub Workflow Status (branch)" src="https://github.com/casdoor/casdoor/workflows/Build/badge.svg?style=flat-square">
  </a>
  <a href="https://github.com/casibase/casibase/releases/latest">
    <img alt="GitHub Release" src="https://img.shields.io/github/v/release/casbin/casibase.svg">
  </a>
  <a href="https://hub.docker.com/repository/docker/casbin/casibase">
    <img alt="Docker Image Version (latest semver)" src="https://img.shields.io/badge/Docker%20Hub-latest-brightgreen">
  </a>
<!-- waiting for changing -->
<!-- <a href="https://hub.docker.com/r/casbin/casibase"> -->
<!-- <a href="https://github.com/casbin/casibase/actions/workflows/build.yml"> -->
<!-- <a href="https://github.com/casibase/casibase/releases/latest"> -->
<!-- <a href="https://hub.docker.com/repository/docker/casbin/casibase"> -->
</p>

<p align="center">
  <a href="https://goreportcard.com/report/github.com/casbin/casibase">
    <img alt="Go Report Card" src="https://goreportcard.com/badge/github.com/casdoor/casdoor?style=flat-square">
  </a>
  <a href="https://github.com/casbin/casibase/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/casbin/casibase?style=flat-square" alt="license">
  </a>
  <a href="https://github.com/casbin/casibase/issues">
    <img alt="GitHub issues" src="https://img.shields.io/github/issues/casbin/casibase?style=flat-square">
  </a>
  <a href="#">
    <img alt="GitHub stars" src="https://img.shields.io/github/stars/casbin/casibase?style=flat-square">
  </a>
  <a href="https://github.com/casbin/casibase/network">
    <img alt="GitHub forks" src="https://img.shields.io/github/forks/casbin/casibase?style=flat-square">
  </a>
  <a href="https://crowdin.com/project/casibase-site">
    <img alt="Crowdin" src="https://badges.crowdin.net/casdoor-site/localized.svg">
  </a>
  <a href="https://gitter.im/casbin/casibase">
    <img alt="Gitter" src="https://badges.gitter.im/casbin/casdoor.svg">
  </a>
<!-- waiting for changing -->
<!-- <a href="https://goreportcard.com/report/github.com/casbin/casibase"> -->
<!-- <a href="https://crowdin.com/project/casibase-site"> -->
<!-- <a href="https://gitter.im/casbin/casibase"> -->
</p>

## Architecture

casibase contains 4 parts:

| **Name**       | **Description**                                   | **Language**                            |
| -------------- | ------------------------------------------------- | --------------------------------------- |
| Frontend       | User interface for the casibase application       | JavaScript + React                      |
| Backend        | Server-side logic and API for casibase            | Golang + Beego + Python + Flask + MySQL |
| AI Model       | Artificial intelligence model                     | Python + OpenAI                         |
| Knowledge Base | Storage for casibase application domain knowledge | pgvector                                |

![0-Architecture-casibase](assets/0-Architecture-casibase.png)

## Demo Installation

casibase uses Casdoor to manage members. So you need to create an organization and an application for casibase in a Casdoor instance.

### Casdoor configuration 

```shell
git clone https://github.com/casdoor/casdoor.git
```

refer to: https://casdoor.org/docs/basic/server-installation

Follow these steps to setup Casdoor for casibase:

- Create an **Organization**![1-Add-organization](assets/1-Add-organization.png)

- Configure information about the **Organization**![2-Configure-information-organization](assets/2-Configure-information-organization.png)

- Add a member to a newly created organization![3-Check-user](assets/3-Check-user.png)![4-Add-member-to-organization](assets/4-Add-member-to-organization.png)

- Configure member information (remember its **Name** as well as **Password**)![5-Configure-new-user](assets/5-Configure-new-user.png)



- Create a new **Application**![6-Add-application](assets/6-Add-application.png)

- Configuring **Application** Information (Remember **Name, ClientID** and **ClientSecret**. Change **RedirectURLs** to http://localhost:14000/callback)![7-Configure-new-application](assets/7-Configure-new-application.png)

### casibase configuration 

#### Get the code

```shell
git clone https://github.com/casbin/casibase.git
```

#### Setup database

casibase will store its users, nodes and topics informations in a MySQL database named: `casibase`, will create it if not existed. The DB connection string can be specified at: https://github.com/casbin/casibase/blob/master/conf/app.conf

```ini
dataSourceName = root:123@tcp(localhost:3306)/
```

Casnode uses XORM to connect to DB, so all DBs supported by XORM can also be used.

#### Custom config

- #### Backend (`casibase\conf\app.conf`)

  ```ini
  clientId = <Your_clientId_in_Casdoor_configuration>
  clientSecret = <Your_clientSecret_in_Casdoor_configuration>
  casdoorDbName = casdoor
  casdoorOrganization = "casibase"
  casdoorApplication = "app-casibase"
  ```

- #### Frontend (`casibase\web\src\Conf.js`)

  ```ini
  export const AuthConfig = {
    ......
    clientId: <Your_clientId_in_Casdoor_configuration>,
    ......
  };
  ```

#### Run casnode

  - #### Backend (`casibase`)

    ```shell
    go run main.go
    ```

  - #### Frontend (`casibase\web`)

    ```shell
    yarn install
    yarn start
    ```

#### Preview

Access the login view via the following link:

```shell
http://localhost:13001
```

![8-Preview-base-wordsets](assets/8-Preview-base-wordsets.png)

![9-Preview-casibase-stores](assets/9-Preview-casibase-stores.png)

The **casibase** demo is shown above, and in the future users can upload various **knowledge** files, **wordsets**, and **vectorsets** to achieve a **customized domain knowledge base**.