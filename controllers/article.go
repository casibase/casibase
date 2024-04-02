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

	"github.com/casibase/casibase/object"
)

func (c *ApiController) GetGlobalArticles() {
	articles, err := object.GetGlobalArticles()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedArticles(articles, true))
}

func (c *ApiController) GetArticles() {
	owner := c.Input().Get("owner")

	articles, err := object.GetArticles(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedArticles(articles, true))
}

func (c *ApiController) GetArticle() {
	id := c.Input().Get("id")

	article, err := object.GetArticle(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedArticle(article, true))
}

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
