// Copyright 2023 The Casibase Authors. All Rights Reserved.
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

package video

import (
	"bytes"
	"context"

	"github.com/aliyun/alibabacloud-oss-go-sdk-v2/oss"
	"github.com/aliyun/alibabacloud-oss-go-sdk-v2/oss/credentials"
)

func getOssClient(endpoint string, accessKeyId string, accessKeySecret string, securityToken string) (*oss.Client, error) {
	cfg := oss.LoadDefaultConfig().
		WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKeyId, accessKeySecret, securityToken)).
		WithRegion("").
		WithEndpoint(endpoint)

	client := oss.NewClient(cfg)
	return client, nil
}

func uploadLocalFile(ossClient *oss.Client, bucketName string, objectKey string, fileBuffer *bytes.Buffer) error {
	_, err := ossClient.PutObject(context.TODO(), &oss.PutObjectRequest{
		Bucket: &bucketName,
		Key:    &objectKey,
		Body:   fileBuffer,
	})
	return err
}
