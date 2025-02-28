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

package controllers

import (
	"encoding/json"

	"github.com/beego/beego/utils/pagination"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

// GetImages
// @Title GetImages
// @Tag Image API
// @Description get all images
// @Param   pageSize     query    string  true        "The size of each page"
// @Param   p     query    string  true        "The number of the page"
// @Success 200 {object} object.Image The Response object
// @router /get-images [get]
func (c *ApiController) GetImages() {
	owner := c.Input().Get("owner")
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	_, err := object.SyncImagesCloud(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if limit == "" || page == "" {
		images, err := object.GetMaskedImages(object.GetImages(owner))
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(images)
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetImageCount(owner, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		images, err := object.GetMaskedImages(object.GetPaginationImages(owner, paginator.Offset(), limit, field, value, sortField, sortOrder))
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(images, paginator.Nums())
	}
}

// GetImage
// @Title GetImage
// @Tag Image API
// @Description get image
// @Param   id     query    string  true        "The id ( owner/name ) of the image"
// @Success 200 {object} object.Image The Response object
// @router /get-image [get]
func (c *ApiController) GetImage() {
	id := c.Input().Get("id")

	image, err := object.GetMaskedImage(object.GetImage(id))
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(image)
}

// UpdateImage
// @Title UpdateImage
// @Tag Image API
// @Description update image
// @Param   id     query    string  true        "The id ( owner/name ) of the image"
// @Param   body    body   object.Image  true        "The details of the image"
// @Success 200 {object} controllers.Response The Response object
// @router /update-image [post]
func (c *ApiController) UpdateImage() {
	id := c.Input().Get("id")

	var image object.Image
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &image)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.UpdateImage(id, &image))
	c.ServeJSON()
}

// AddImage
// @Title AddImage
// @Tag Image API
// @Description add a image
// @Param   body    body   object.Image  true        "The details of the image"
// @Success 200 {object} controllers.Response The Response object
// @router /add-image [post]
func (c *ApiController) AddImage() {
	var image object.Image
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &image)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.AddImage(&image))
	c.ServeJSON()
}

// DeleteImage
// @Title DeleteImage
// @Tag Image API
// @Description delete a image
// @Param   body    body   object.Image  true        "The details of the image"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-image [post]
func (c *ApiController) DeleteImage() {
	var image object.Image
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &image)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.DeleteImage(&image))
	c.ServeJSON()
}
