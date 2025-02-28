// Copyright 2025 The casbin Authors. All Rights Reserved.
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

package object

import (
	"github.com/casibase/casibase/service"
)

func getImageFromService(owner string, provider string, clientImage *service.Image) *Image {
	return &Image{
		Owner:                   owner,
		Provider:                provider,
		Name:                    clientImage.Name,
		Category:                clientImage.Category,
		BootMode:                clientImage.BootMode,
		ImageId:                 clientImage.ImageId,
		ImageOwnerAlias:         clientImage.ImageOwnerAlias,
		OSName:                  clientImage.OSName,
		OSNameEn:                clientImage.OSNameEn,
		ImageFamily:             clientImage.ImageFamily,
		Architecture:            clientImage.Architecture,
		IsSupportIoOptimized:    clientImage.IsSupportIoOptimized,
		Size:                    clientImage.Size,
		ResourceGroupId:         clientImage.ResourceGroupId,
		SupplierName:            clientImage.SupplierName,
		Description:             clientImage.Description,
		Usage:                   clientImage.Usage,
		IsCopied:                clientImage.IsCopied,
		LoginAsNonRootSupported: clientImage.LoginAsNonRootSupported,
		ImageVersion:            clientImage.ImageVersion,
		OSType:                  clientImage.OSType,
		IsSubscribed:            clientImage.IsSubscribed,
		IsSupportCloudinit:      clientImage.IsSupportCloudinit,
		CreationTime:            clientImage.CreationTime,
		ProductCode:             clientImage.ProductCode,
		Progress:                clientImage.Progress,
		Platform:                clientImage.Platform,
		IsSelfShared:            clientImage.IsSelfShared,
		ImageName:               clientImage.ImageName,
		Status:                  clientImage.Status,
		ImageOwnerId:            clientImage.ImageOwnerId,
		IsPublic:                clientImage.IsPublic,
	}
}

func getImagesCloud(owner string) ([]*Image, error) {
	images := []*Image{}
	providers, err := getActiveCloudProviders(owner)
	if err != nil {
		return nil, err
	}

	for _, provider := range providers {
		client, err2 := service.NewImageClient(provider.Type, provider.ClientId, provider.ClientSecret, provider.Region)
		if len(images) > 0 && err2 != nil {
			continue
		}
		if err2 != nil {
			return nil, err2
		}

		clientImages, err2 := client.GetImages()

		for _, clientImage := range clientImages {
			images = append(images, getImageFromService(owner, provider.Type, clientImage))
		}

	}

	return images, nil
}

func SyncImagesCloud(owner string) (bool, error) {
	images, err := getImagesCloud(owner)
	if err != nil {
		return false, err
	}

	dbImages, err := GetImages(owner)
	if err != nil {
		return false, err
	}

	dbImageMap := map[string]*Image{}
	for _, dbImage := range dbImages {
		dbImageMap[dbImage.GetId()] = dbImage
	}

	for _, image := range images {
		if dbImage, ok := dbImageMap[image.GetId()]; ok {
			image.RemoteProtocol = dbImage.RemoteProtocol
			image.RemotePort = dbImage.RemotePort
			image.RemoteUsername = dbImage.RemoteUsername
			image.RemotePassword = dbImage.RemotePassword
		}
	}

	_, err = deleteImages(owner)
	if err != nil {
		return false, err
	}

	if len(images) == 0 {
		return false, nil
	}

	affected, err := addImages(images)
	return affected, err
}

//func updateImageCloud(oldImage *Image, image *Image) (bool, error) {
//	provider, err := getProvider(oldImage.Owner, oldImage.Provider)
//	if err != nil {
//		return false, err
//	}
//	if provider == nil {
//		return false, fmt.Errorf("The provider: %s does not exist", image.Provider)
//	}
//
//	client, err := service.NewImageClient(provider.Type, provider.ClientId, provider.ClientSecret, provider.Region)
//	if err != nil {
//		return false, err
//	}
//
//	if oldImage.State != image.State {
//		affected, _, err := client.UpdateImageState(oldImage.Name, image.State)
//		if err != nil {
//			return false, err
//		}
//
//		return affected, nil
//	}
//
//	return false, nil
//}
