// Copyright 2025 The Casibase Authors. All Rights Reserved.
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

// GetAssets
// @Title GetAssets
// @Tag Asset API
// @Description get all assets
// @Param   pageSize     query    string  true        "The size of each page"
// @Param   p     query    string  true        "The number of the page"
// @Success 200 {object} object.Asset The Response object
// @router /get-assets [get]
func (c *ApiController) GetAssets() {
	owner := c.Input().Get("owner")
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	if limit == "" || page == "" {
		assets, err := object.GetMaskedAssets(object.GetAssets(owner))
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(assets)
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetAssetCount(owner, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		assets, err := object.GetMaskedAssets(object.GetPaginationAssets(owner, paginator.Offset(), limit, field, value, sortField, sortOrder))
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(assets, paginator.Nums())
	}
}

// GetAsset
// @Title GetAsset
// @Tag Asset API
// @Description get asset
// @Param   id     query    string  true        "The id ( owner/name ) of the asset"
// @Success 200 {object} object.Asset The Response object
// @router /get-asset [get]
func (c *ApiController) GetAsset() {
	id := c.Input().Get("id")

	asset, err := object.GetMaskedAsset(object.GetAsset(id))
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(asset)
}

// UpdateAsset
// @Title UpdateAsset
// @Tag Asset API
// @Description update asset
// @Param   id     query    string  true        "The id ( owner/name ) of the asset"
// @Param   body    body   object.Asset  true        "The details of the asset"
// @Success 200 {object} controllers.Response The Response object
// @router /update-asset [post]
func (c *ApiController) UpdateAsset() {
	id := c.Input().Get("id")

	var asset object.Asset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &asset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.UpdateAsset(id, &asset))
	c.ServeJSON()
}

// AddAsset
// @Title AddAsset
// @Tag Asset API
// @Description add a asset
// @Param   body    body   object.Asset  true        "The details of the asset"
// @Success 200 {object} controllers.Response The Response object
// @router /add-asset [post]
func (c *ApiController) AddAsset() {
	var asset object.Asset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &asset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.AddAsset(&asset))
	c.ServeJSON()
}

// DeleteAsset
// @Title DeleteAsset
// @Tag Asset API
// @Description delete a asset
// @Param   body    body   object.Asset  true        "The details of the asset"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-asset [post]
func (c *ApiController) DeleteAsset() {
	var asset object.Asset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &asset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.DeleteAsset(&asset))
	c.ServeJSON()
}
