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
	"fmt"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"
)

func getBucket(bucketName string) (*oss.Bucket, error) {
	client, err := oss.New(endpoint, clientId, clientSecret)
	if err != nil {
		panic(err)
	}

	bucket, err := client.Bucket(bucketName)
	if err != nil {
		return nil, err
	}

	return bucket, nil
}

func ListObjects(bucketName string, prefix string) ([]oss.ObjectProperties, error) {
	if bucketName == "" {
		return nil, fmt.Errorf("bucket name is empty")
	}

	bucket, err := getBucket(bucketName)
	if err != nil {
		return nil, err
	}

	res := []oss.ObjectProperties{}
	marker := oss.Marker("")
	i := 0
	for {
		resp, err := bucket.ListObjects(oss.Prefix(prefix), oss.MaxKeys(1000), marker)
		if err != nil {
			return nil, err
		}

		marker = oss.Marker(resp.NextMarker)

		for _, object := range resp.Objects {
			res = append(res, object)
			// fmt.Printf("[%d] %s\n", i, object.Key)
			i += 1
		}

		if !resp.IsTruncated {
			break
		}
	}

	return res, nil
}

func PutObject(bucketName string, key string, fileBuffer *bytes.Buffer) error {
	bucket, err := getBucket(bucketName)
	if err != nil {
		return err
	}

	err = bucket.PutObject(key, fileBuffer)
	return err
}

func DeleteObject(bucketName string, key string) error {
	bucket, err := getBucket(bucketName)
	if err != nil {
		return err
	}

	err = bucket.DeleteObject(key)
	return err
}
