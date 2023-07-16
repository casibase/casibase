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
	"context"
	"fmt"
	"io"

	_ "github.com/rclone/rclone/backend/all"
	"github.com/rclone/rclone/fs"
)

func getFs(bucketName string) (fs.Fs, error) {
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

func PutObject2(bucketName string, key string, in io.Reader) error {
	f, err := getFs(bucketName)
	if err != nil {
		return err
	}

	// Use Rcat to put an object to the remote
	//_, err = operations.Rcat(context.Background(), f, key, nil, nil, nil)
	print(f)

	return err
}

func DeleteObject2(bucketName string, key string) error {
	f, err := getFs(bucketName)
	if err != nil {
		return err
	}

	remoteObj, err := f.NewObject(context.Background(), key)
	if err != nil {
		return err
	}

	return remoteObj.Remove(context.Background())
}
