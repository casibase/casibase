// Copyright 2021 The casbin Authors. All Rights Reserved.
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

package discuzx

import (
	"fmt"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"
)

var bucket *oss.Bucket

func init() {
	bucket = getBucket()
}

func getBucket() *oss.Bucket {
	client, err := oss.New(ossEndpoint, ossAccessKeyId, ossAccessKeySecret)
	if err != nil {
		panic(err)
	}

	bucket, err := client.Bucket(ossBucketName)
	if err != nil {
		panic(err)
	}

	return bucket
}

func copyFile(attachmentPath string, dstObjectKey string) {
	// attachmentPath = "202004/22/xxx.jpg"
	srcObjectKey := fmt.Sprintf("old_attachment/forum/%s", attachmentPath)
	_, err := bucket.CopyObject(srcObjectKey, dstObjectKey)
	if err != nil {
		println(err)
		//panic(err)
	}
}
