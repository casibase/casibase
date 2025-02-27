// Copyright 2024 The casbin Authors. All Rights Reserved.
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

package service

import (
	"fmt"

	"github.com/aliyun/alibaba-cloud-sdk-go/services/ecs"
)

type Image struct {
	Owner    string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name     string `xorm:"varchar(100) notnull pk" json:"name"`
	Provider string `xorm:"varchar(100)" json:"provider"`
	Category string `xorm:"varchar(100)" json:"category"`

	BootMode                string `xorm:"varchar(100)" json:"bootMode" xml:"bootMode"`
	ImageId                 string `xorm:"varchar(100)" json:"imageId" xml:"imageId"`
	ImageOwnerAlias         string `xorm:"varchar(100)" json:"ImageOwnerAlias" xml:"ImageOwnerAlias"`
	OSName                  string `xorm:"varchar(100)" json:"os" xml:"os"`
	OSNameEn                string `xorm:"varchar(100)" json:"OSNameEn" xml:"OSNameEn"`
	ImageFamily             string `xorm:"varchar(100)" json:"ImageFamily" xml:"ImageFamily"`
	Architecture            string `xorm:"varchar(100)" json:"systemArchitecture" xml:"systemArchitecture"`
	IsSupportIoOptimized    bool   `json:"IsSupportIoOptimized" xml:"IsSupportIoOptimized"`
	Size                    string `xorm:"varchar(100)" json:"size" xml:"size"`
	ResourceGroupId         string `xorm:"varchar(100)" json:"ResourceGroupId" xml:"ResourceGroupId"`
	SupplierName            string `xorm:"varchar(100)" json:"SupplierName" xml:"SupplierName"`
	Description             string `xorm:"varchar(100)" json:"description" xml:"description"`
	Usage                   string `xorm:"varchar(100)" json:"Usage" xml:"Usage"`
	IsCopied                bool   `json:"IsCopied" xml:"IsCopied"`
	LoginAsNonRootSupported bool   `json:"LoginAsNonRootSupported" xml:"LoginAsNonRootSupported"`
	ImageVersion            string `xorm:"varchar(100)" json:"ImageVersion" xml:"ImageVersion"`
	OSType                  string `xorm:"varchar(100)" json:"OSType" xml:"OSType"`
	IsSubscribed            bool   `json:"IsSubscribed" xml:"IsSubscribed"`
	IsSupportCloudinit      bool   `json:"IsSupportCloudinit" xml:"IsSupportCloudinit"`
	CreationTime            string `xorm:"varchar(100)" json:"createdTime" xml:"createdTime"`
	ProductCode             string `xorm:"varchar(100)" json:"ProductCode" xml:"ProductCode"`
	Progress                string `xorm:"varchar(100)" json:"progress" xml:"progress"`
	Platform                string `xorm:"varchar(100)" json:"platform" xml:"platform"`
	IsSelfShared            string `xorm:"varchar(100)" json:"IsSelfShared" xml:"IsSelfShared"`
	ImageName               string `xorm:"varchar(100)" json:"ImageName" xml:"ImageName"`
	Status                  string `xorm:"varchar(100)" json:"state" xml:"state"`
	ImageOwnerId            int64  `json:"ImageOwnerId" xml:"ImageOwnerId"`
	IsPublic                bool   `json:"IsPublic" xml:"IsPublic"`
}

type ImageAliyunClient struct {
	Client *ecs.Client
	Region string
}

func newImageAliyunClient(accessKeyId string, accessKeySecret string, region string) (ImageAliyunClient, error) {
	client, err := ecs.NewClientWithAccessKey(
		region,
		accessKeyId,
		accessKeySecret,
	)
	if err != nil {
		return ImageAliyunClient{}, err
	}
	return ImageAliyunClient{Client: client}, nil
}

func getImageFromAliyunImage(aliyunImage ecs.Image) *Image {
	image := &Image{
		Name:                    aliyunImage.ImageId,
		// BootMode:                aliyunImage.BootMode,
		ImageId:                 aliyunImage.ImageId,
		ImageOwnerAlias:         aliyunImage.ImageOwnerAlias,
		OSName:                  aliyunImage.OSName,
		OSNameEn:                aliyunImage.OSNameEn,
		ImageFamily:             aliyunImage.ImageFamily,
		Architecture:            aliyunImage.Architecture,
		IsSupportIoOptimized:    aliyunImage.IsSupportIoOptimized,
		Size:                    fmt.Sprintf("%v GiB", aliyunImage.Size),
		ResourceGroupId:         aliyunImage.ResourceGroupId,
		SupplierName:            aliyunImage.SupplierName,
		Description:             aliyunImage.Description,
		Usage:                   aliyunImage.Usage,
		IsCopied:                aliyunImage.IsCopied,
		LoginAsNonRootSupported: aliyunImage.LoginAsNonRootSupported,
		ImageVersion:            aliyunImage.ImageVersion,
		OSType:                  aliyunImage.OSType,
		IsSubscribed:            aliyunImage.IsSubscribed,
		IsSupportCloudinit:      aliyunImage.IsSupportCloudinit,
		CreationTime:            aliyunImage.CreationTime,
		ProductCode:             aliyunImage.ProductCode,
		Progress:                aliyunImage.Progress,
		Platform:                aliyunImage.Platform,
		IsSelfShared:            aliyunImage.IsSelfShared,
		ImageName:               aliyunImage.ImageName,
		Status:                  aliyunImage.Status,
		ImageOwnerId:            aliyunImage.ImageOwnerId,
		IsPublic:                aliyunImage.IsPublic,
	}

	return image
}

func (client ImageAliyunClient) GetImages() ([]*Image, error) {
	request := ecs.CreateDescribeImagesRequest()
	request.RegionId = client.Region
	request.PageSize = "100"

	response, err := client.Client.DescribeImages(request)
	if err != nil {
		return nil, err
	}

	images := []*Image{}
	for _, image := range response.Images.Image {
		images = append(images, getImageFromAliyunImage(image))
		if images[len(images)-1].IsPublic {
			images[len(images)-1].Category = "Public Image"
		} else {
			images[len(images)-1].Category = "Private Image"
		}
	}

	return images, nil
}
