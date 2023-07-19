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
	"time"
)

func ConfigLoad() []string {
	config.GetConfigPath()

	configfile.Install()
	sections := config.Data().GetSectionList()
	return sections
}

func getFs(bucketName string) (fs.Fs, error) {
	ConfigLoad()
	f, err := fs.NewFs(context.Background(), bucketName)
	if err != nil {
		return nil, err
	}

	return f, nil
}

func ListObjects2(bucketName string, prefix string) ([]fs.DirEntry, error) {
	if bucketName == "" {
		return nil, fmt.Errorf("bucket name is empty")
	}

	f, err := getFs(bucketName)
	if err != nil {
		return nil, err
	}

	entries, err := f.List(context.Background(), prefix)
	if err != nil {
		return nil, err
	}

	return entries, nil
}

func PutObject2(bucketName string, addPath string, in *bytes.Buffer) error {
	f, err := getFs(bucketName)
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
func DeleteObject2(bucketName string, delPath string) error {
	f, err := getFs(bucketName)
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
