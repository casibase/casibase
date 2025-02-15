// Copyright 2024 The Casibase Authors. All Rights Reserved.
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

// GetGlobalArticles
// @Title GetGlobalArticles
// @Tag Article API
// @Description get global articles
// @Success 200 {array} object.Article The Response object
// @router /get-global-articles [get]
func (c *ApiController) GetGlobalArticles() {
	articles, err := object.GetGlobalArticles()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedArticles(articles, true))
}

// GetArticles
// @Title GetArticles
// @Tag Article API
// @Description get articles
// @Param owner query string true "The owner of article"
// @Success 200 {array} object.Article The Response object
// @router /get-articles [get]
func (c *ApiController) GetArticles() {
	owner := c.Input().Get("owner")
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	if limit == "" || page == "" {
		articles, err := object.GetArticles(owner)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		c.ResponseOk(object.GetMaskedArticles(articles, true))
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetArticleCount(owner, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		articles, err := object.GetPaginationArticles(owner, paginator.Offset(), limit, field, value, sortField, sortOrder)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(articles, paginator.Nums())
	}
}

// GetArticle
// @Title GetArticle
// @Tag Article API
// @Description get article
// @Param id query string true "The id (owner/name) of article"
// @Success 200 {object} object.Article The Response object
// @router /get-article [get]
func (c *ApiController) GetArticle() {
	id := c.Input().Get("id")

	article, err := object.GetArticle(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedArticle(article, true))
}

// UpdateArticle
// @Title UpdateArticle
// @Tag Article API
// @Description update article
// @Param id query string true "The id (owner/name) of the article"
// @Param body body object.Article true "The details of the article"
// @Success 200 {object} controllers.Response The Response object
// @router /update-article [post]
func (c *ApiController) UpdateArticle() {
	id := c.Input().Get("id")

	var article object.Article
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &article)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateArticle(id, &article)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// AddArticle
// @Title AddArticle
// @Tag Article API
// @Description add article
// @Param body body object.Article true "The details of the article"
// @Success 200 {object} controllers.Response The Response object
// @router /add-article [post]
func (c *ApiController) AddArticle() {
	var article object.Article
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &article)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.AddArticle(&article)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// DeleteArticle
// @Title DeleteArticle
// @Tag Article API
// @Description delete article
// @Param body body object.Article true "The details of the article"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-article [post]
func (c *ApiController) DeleteArticle() {
	var article object.Article
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &article)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteArticle(&article)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}
