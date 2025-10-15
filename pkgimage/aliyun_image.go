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

package pkgimage

import (
	"fmt"

	openapi "github.com/alibabacloud-go/darabonba-openapi/v2/client"
	ecs20140526 "github.com/alibabacloud-go/ecs-20140526/v4/client"
	"github.com/alibabacloud-go/tea/tea"
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
	Client *ecs20140526.Client
	Region string
}

func newImageAliyunClient(accessKeyId string, accessKeySecret string, region string) (ImageAliyunClient, error) {
	config := &openapi.Config{
		AccessKeyId:     tea.String(accessKeyId),
		AccessKeySecret: tea.String(accessKeySecret),
		RegionId:        tea.String(region),
		Endpoint:        tea.String("ecs." + region + ".aliyuncs.com"),
	}
	client, err := ecs20140526.NewClient(config)
	if err != nil {
		return ImageAliyunClient{}, err
	}
	return ImageAliyunClient{Client: client, Region: region}, nil
}

func getImageFromAliyunImage(aliyunImage *ecs20140526.DescribeImagesResponseBodyImagesImage) *Image {
	image := &Image{
		// BootMode:                tea.StringValue(aliyunImage.BootMode),
		Name:                    tea.StringValue(aliyunImage.ImageId),
		ImageId:                 tea.StringValue(aliyunImage.ImageId),
		ImageOwnerAlias:         tea.StringValue(aliyunImage.ImageOwnerAlias),
		OSName:                  tea.StringValue(aliyunImage.OSName),
		OSNameEn:                tea.StringValue(aliyunImage.OSNameEn),
		ImageFamily:             tea.StringValue(aliyunImage.ImageFamily),
		Architecture:            tea.StringValue(aliyunImage.Architecture),
		IsSupportIoOptimized:    tea.BoolValue(aliyunImage.IsSupportIoOptimized),
		Size:                    fmt.Sprintf("%v GiB", tea.Int32Value(aliyunImage.Size)),
		ResourceGroupId:         tea.StringValue(aliyunImage.ResourceGroupId),
		SupplierName:            tea.StringValue(aliyunImage.SupplierName),
		Description:             tea.StringValue(aliyunImage.Description),
		Usage:                   tea.StringValue(aliyunImage.Usage),
		IsCopied:                tea.BoolValue(aliyunImage.IsCopied),
		LoginAsNonRootSupported: tea.BoolValue(aliyunImage.LoginAsNonRootSupported),
		ImageVersion:            tea.StringValue(aliyunImage.ImageVersion),
		OSType:                  tea.StringValue(aliyunImage.OSType),
		IsSubscribed:            tea.BoolValue(aliyunImage.IsSubscribed),
		IsSupportCloudinit:      tea.BoolValue(aliyunImage.IsSupportCloudinit),
		CreationTime:            tea.StringValue(aliyunImage.CreationTime),
		ProductCode:             tea.StringValue(aliyunImage.ProductCode),
		Progress:                tea.StringValue(aliyunImage.Progress),
		Platform:                tea.StringValue(aliyunImage.Platform),
		IsSelfShared:            tea.StringValue(aliyunImage.IsSelfShared),
		ImageName:               tea.StringValue(aliyunImage.ImageName),
		Status:                  tea.StringValue(aliyunImage.Status),
		ImageOwnerId:            tea.Int64Value(aliyunImage.ImageOwnerId),
		IsPublic:                tea.BoolValue(aliyunImage.IsPublic),
	}

	return image
}

func (client ImageAliyunClient) GetImages() ([]*Image, error) {
	request := &ecs20140526.DescribeImagesRequest{
		RegionId: tea.String(client.Region),
		PageSize: tea.Int32(100),
	}

	response, err := client.Client.DescribeImages(request)
	if err != nil {
		return nil, err
	}

	images := []*Image{}
	for _, image := range response.Body.Images.Image {
		images = append(images, getImageFromAliyunImage(image))
		if images[len(images)-1].IsPublic {
			images[len(images)-1].Category = "Public Image"
		} else {
			images[len(images)-1].Category = "Private Image"
		}
	}

	return images, nil
}
