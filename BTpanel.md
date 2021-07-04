# Install casnode under the Linux BT panel  
The tutorial environment is Ubuntu 20.0.4 .  
After installing the BT panel, the browser visits the pagoda panel, selects the software store, searches for and installs MySQL, and then searches for node, you can see that there is a PM2 manager, install the PM2 manager.    
After the installation is complete, disconnect from the server or restart the server, node will be automatically written into the environment variable.  
Enter git --version to view the git version, if it prompts Command'git' not found, use apt-get install git to install git.  
Install golang:  
The root user executes the following commands to download and decompress the Go binary file to the /usr/local directory.  

    wget -c https://dl.google.com/go/go1.16.5.linux-amd64.tar.gz -O - | sudo tar -xz -C /usr/local
Then we need to add go to the environment variables,
sudo vim /etc/profile,
Enter i, write the following code in the last line of the file.

    export GOROOT=/usr/local/go
    export PATH=\$PATH:\$GOROOT/bin
Press Esc and enter:wq and source /etc/profile.  
Now,enter go version,You will see the go version, and we installed it successfully. If you can’t connect to github, you can set up the mirror. The command is

    go env -w GOPROXY=https://goproxy.cn,direct
Next, execute the following commands in the folder where you want to store the project.

    git clone https://github.com/casbin/casdoor.git
    git clone https://github.com/casbin/casnode.git
Now, you can see two folders, casnode and casdoor.
We first configure casdoor.

    cd casdoor
    go build main.go
    vim conf/app.conf
Enter i,find

    dataSourceName = root:123@tcp(localhost:3306)/
Change 123 to the MySQL password provided by the BT panel,then press Esc,enter:wq to save and exit.

    cd web
    npm install
    npm run build
    cd ..
    sudo nohup ./main &
Now that Casdoor has been configured, visit http://your-ip:8000 to configure Casnode.  
The default administrator login account is admin/123.
Click Organization, then click Add, click Edit for the added organization, and change the name to the organization name you want. Here I set it to casbin-forum, and then click Save.  
Click Applications, then click Add, for the application you just added, click Edit, change the name to the application name you want, I changed it to app-casbin-forum.Click on the organization, select the organization you just added, my organization  is casbin- forum. Click Redirect URLs, modify the link in the box to http://your-ip:7000/callback.Finally, remember the Client ID and Client Secret, and click Save.  
Click Users, click Add, then click Edit, modify the added user, click Organization, select casbin-forum, and click is admin. Finally click Save, now your organization has an administrator account.

Next we configure in Casnode.

    sudo su
    cd casnode
    go build main.go
    vim conf/app.conf
Enter i.find

    dataSourceName = root:123@tcp(localhost:3306)/
Change 123 to the MySQL password provided by the BT panel, then find casdoorEndpoint, modify it to http://your-ip:8000 (Casdoor backend address), find clientId and clientSecret, and modify them to the previously remembered Application client id and client secret, find casdoorOrganization, modify the organization name to you set. Finally press Esc, enter: wq to save and exit.

    cd web
    vim src/Conf.js
Press i, modify serverUrl to http://your-ip:8000 (Casdoor front-end access address), modify clientId to the clientId of the application just added, modify appname to the set application name, and modify the organization to the set organization name. Click Esc, enter: wq to save and exit.

    npm install
    npm run build
    cd ..
    nohup ./main &
Next visit http://your-ip:7000, click login, enter the account you added before, user_1/123, you have now successfully logged in to Casnode.  
More settings reference [casnode](https://casnode.org/docs)

