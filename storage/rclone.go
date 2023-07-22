// Copyright 2023 The casbin Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package storage

import (
	"bytes"
	"context"
	"fmt"
	_ "github.com/rclone/rclone/backend/all"
	"github.com/rclone/rclone/fs"
	"github.com/rclone/rclone/fs/config"
	"github.com/rclone/rclone/fs/config/configfile"
	"github.com/rclone/rclone/fs/object"
	"github.com/rclone/rclone/fs/rc"
	"time"
)

type ConnectConfig struct {
	AccessKeyId     string `json:"access_key_id"`
	SecretAccessKey string `json:"secret_access_key"`
	TypeName        string `json:"typeName"`
	Name            string `json:"name"`
	Token           string `json:"token"`
}

func CreateConnection(con ConnectConfig) error {

	ctx := context.Background()

	keyValues := rc.Params{
		"access_key_id":     con.AccessKeyId,
		"secret_access_key": con.SecretAccessKey,
		"token":             con.Token,
		"drive_id":          "F7F303BA8FDA4248",
		"drive_type":        "personal",
	}

	_, err := config.CreateRemote(ctx, con.Name, con.TypeName, keyValues, config.UpdateRemoteOpt{NonInteractive: true})

	config.SaveConfig()

	return err
}

func ConfigLoad() []string {
	fmt.Println(config.GetConfigPath())

	configfile.Install()
	sections := config.Data().GetSectionList()
	fmt.Println(config.Data().GetKeyList(sections[0]))

	return sections
}

func getFs(con ConnectConfig) (fs.Fs, error) {
	err := CreateConnection(con)
	if err != nil {
		return nil, err
	}
	//ConfigLoad(con)
	f, err := fs.NewFs(context.Background(), con.Name+":/")
	fmt.Println(f)
	if err != nil {
		return nil, err
	}

	return f, nil
}

func ListObjects2(con ConnectConfig, prefix string) ([]fs.DirEntry, error) {
	if con.Name == "" {
		return nil, fmt.Errorf("bucket name is empty")
	}

	f, err := getFs(con)
	if err != nil {
		return nil, err
	}

	entries, err := f.List(context.Background(), prefix)
	if err != nil {
		return nil, err
	}

	return entries, nil
}

func PutObject2(con ConnectConfig, addPath string, in *bytes.Buffer) error {
	f, err := getFs(con)
	if err != nil {
		return err
	}

	dstObj := object.NewStaticObjectInfo(addPath, time.Now(), int64(in.Len()), true, nil, nil)
	if err != nil {
		return err
	}

	_, err = f.Put(context.Background(), in, dstObj)

	return err
}

// DeleteObject2 support delete file or dir
func DeleteObject2(con ConnectConfig, delPath string) error {
	f, err := getFs(con)

	if err != nil {
		return err
	}

	remoteObj, err := f.NewObject(context.Background(), delPath)
	if err != nil {
		//	dir: only can delete empty dir
		return f.Rmdir(context.Background(), delPath)
	}
	//object
	return remoteObj.Remove(context.Background())
}
