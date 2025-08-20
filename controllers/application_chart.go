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

// GetApplicationChart
// @Title GetApplicationChart
// @Tag ApplicationChart API
// @Description get application chart
// @Param id query string true "The id of application chart"
// @Success 200 {object} object.ApplicationChart The Response object
// @router /get-application-chart [get]
func (c *ApiController) GetApplicationChart() {
	id := c.Input().Get("id")

	res, err := object.GetApplicationChart(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(res)
}

// GetApplicationCharts
// @Title GetApplicationCharts
// @Tag ApplicationChart API
// @Description get application charts
// @Param owner query string true "The owner of application charts"
// @Success 200 {array} object.ApplicationChart The Response object
// @router /get-application-charts [get]
func (c *ApiController) GetApplicationCharts() {
	owner := c.Input().Get("owner")
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	if limit == "" || page == "" {
		applicationCharts, err := object.GetApplicationCharts(owner)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		c.ResponseOk(applicationCharts)
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetApplicationChartCount(owner, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		applicationCharts, err := object.GetPaginationApplicationCharts(owner, paginator.Offset(), limit, field, value, sortField, sortOrder)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(applicationCharts, paginator.Nums())
	}
}

// UpdateApplicationChart
// @Title UpdateApplicationChart
// @Tag ApplicationChart API
// @Description update application chart
// @Param id query string true "The id (owner/name) of the application chart"
// @Param body body object.ApplicationChart true "The details of the application chart"
// @Success 200 {object} controllers.Response The Response object
// @router /update-application-chart [post]
func (c *ApiController) UpdateApplicationChart() {
	id := c.Input().Get("id")

	var applicationChart object.ApplicationChart
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &applicationChart)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateApplicationChart(id, &applicationChart)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// DeleteApplicationChart
// @Title DeleteApplicationChart
// @Tag ApplicationChart API
// @Description delete application chart
// @Param body body object.ApplicationChart true "The details of the application chart"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-application-chart [post]
func (c *ApiController) DeleteApplicationChart() {
	var applicationChart object.ApplicationChart
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &applicationChart)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteApplicationChart(&applicationChart)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// AddApplicationChart
// @Title AddApplicationChart
// @Tag ApplicationChart API
// @Description add application chart
// @Param body body object.ApplicationChart true "The details of the application chart"
// @Success 200 {object} controllers.Response The Response object
// @router /add-application-chart [post]
func (c *ApiController) AddApplicationChart() {
	var applicationChart object.ApplicationChart
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &applicationChart)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.AddApplicationChart(&applicationChart)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// AddApplicationCharts
// @Title AddApplicationCharts
// @Tag ApplicationChart API
// @Description load application charts from repository
// @Param owner query string true "The owner of application charts"
// @Param repoUrl query string true "The repository URL"
// @Success 200 {object} controllers.Response The Response object
// @router /add-application-charts [post]
func (c *ApiController) AddApplicationCharts() {
	owner := c.Input().Get("owner")
	repoUrl := c.Input().Get("repoUrl")

	if owner == "" || repoUrl == "" {
		c.ResponseError("Missing required parameters: owner and repoUrl")
		return
	}

	err := object.AddApplicationChartsFromRepo(owner, repoUrl)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk("Application charts loaded successfully")
}

// GetApplicationChartContent
// @Title GetApplicationChartContent
// @Tag ApplicationChart API
// @Description get application chart content
// @Param owner query string true "The owner of application chart"
// @Param name query string true "The name of application chart"
// @Success 200 {object} object.ChartContent The Response object
// @router /get-application-chart-content [get]
func (c *ApiController) GetApplicationChartContent() {
	owner := c.Input().Get("owner")
	name := c.Input().Get("name")
	// Direct get application chart content from URL
	url := c.Input().Get("url")
	if url != "" {
		chartContent, err := object.GetApplicationChartContentFromUrl(url)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		c.ResponseOk(chartContent)
		return
	}

	if owner == "" || name == "" {
		c.ResponseError("Missing required parameters: owner and name")
		return
	}

	chartContent, err := object.GetApplicationChartContent(owner, name)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(chartContent)
}

// UpdateApplicationChartContent
// @Title UpdateApplicationChartContent
// @Tag ApplicationChart API
// @Description render application chart with custom values
// @Param owner query string true "The owner of application chart"
// @Param name query string true "The name of application chart"
// @Param body body map[string]interface{} true "The custom values JSON"
// @Success 200 {object} object.RenderedChart The Response object
// @router /update-application-chart-content [post]
func (c *ApiController) UpdateApplicationChartContent() {
	owner := c.Input().Get("owner")
	name := c.Input().Get("name")

	if owner == "" || name == "" {
		c.ResponseError("Missing required parameters: owner and name")
		return
	}

	var options object.ChartReleaseOptions
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &options)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	renderedChart, err := object.ReleaseApplicationChart(owner, name, &options)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(renderedChart)
}
