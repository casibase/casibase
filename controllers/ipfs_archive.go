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

package controllers

import (
	"encoding/json"

	"github.com/beego/beego/utils/pagination"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

// GetIpfsArchives
// @Title GetIpfsArchives
// @Tag IpfsArchive API
// @Description get all ipfs archives
// @Param   pageSize     query    string  true        "The size of each page"
// @Param   p     query    string  true        "The number of the page"
// @Param   field     query    string  false        "The field to search"
// @Param   value     query    string  false        "The value to search"
// @Param   sortField     query    string  false        "The field to sort"
// @Param   sortOrder     query    string  false        "The order to sort"
// @Success 200 {object} object.IpfsArchive The Response object
// @router /get-ipfs-archives [get]
func (c *ApiController) GetIpfsArchives() {
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")

	if limit == "" || page == "" {
		archives, err := object.GetIpfsArchives(0, 0, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(archives)
	} else {
		limit, err := util.ParseIntWithError(limit)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		// pageNum, err := util.ParseIntWithError(page)
		// if err != nil {
		// 	c.ResponseError(err.Error())
		// 	return
		// }

		// Temporarily get all archives for pagination (to be replaced with proper count function)
		allArchives, err := object.GetIpfsArchives(0, 0, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		count := len(allArchives)

		paginator := pagination.SetPaginator(c.Ctx, limit, int64(count))
		archives, err := object.GetIpfsArchives(paginator.Offset(), limit, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(archives, paginator.Nums())
	}
}

// GetIpfsArchive
// @Title GetIpfsArchive
// @Tag IpfsArchive API
// @Description get ipfs archive
// @Param   correlation_id     query    string  true        "The correlation_id of the ipfs archive"
// @Success 200 {object} object.IpfsArchive The Response object
// @router /get-ipfs-archive [get]
func (c *ApiController) GetIpfsArchive() {
	correlationId := c.Input().Get("correlation_id")

	archive, err := object.GetIpfsArchiveByCorrelationId(correlationId)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(archive)
}

// AddIpfsArchive
// @Title AddIpfsArchive
// @Tag IpfsArchive API
// @Description add a ipfs archive
// @Param   body    body   object.IpfsArchive  true        "The details of the ipfs archive"
// @Success 200 {object} controllers.Response The Response object
// @router /add-ipfs-archive [post]
func (c *ApiController) AddIpfsArchive() {
	var archive object.IpfsArchive
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &archive)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.AddIpfsArchive(&archive))
	c.ServeJSON()
}

// UpdateIpfsArchive
// @Title UpdateIpfsArchive
// @Tag IpfsArchive API
// @Description update ipfs archive
// @Param   correlation_id     query    string  true        "The correlation_id of the ipfs archive"
// @Param   body    body   object.IpfsArchive  true        "The details of the ipfs archive"
// @Success 200 {object} controllers.Response The Response object
// @router /update-ipfs-archive [post]
func (c *ApiController) UpdateIpfsArchive() {
	correlationId := c.Input().Get("correlation_id")

	var archive object.IpfsArchive
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &archive)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// 确保correlation_id匹配
	archive.CorrelationId = correlationId

	c.Data["json"] = wrapActionResponse(object.UpdateIpfsArchive(&archive))
	c.ServeJSON()
}

// DeleteIpfsArchive
// @Title DeleteIpfsArchive
// @Tag IpfsArchive API
// @Description delete a ipfs archive
// @Param   body    body   object.IpfsArchive  true        "The details of the ipfs archive"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-ipfs-archive [post]
func (c *ApiController) DeleteIpfsArchive() {
	var archive object.IpfsArchive
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &archive)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.DeleteIpfsArchive(archive.CorrelationId))
	c.ServeJSON()
}
