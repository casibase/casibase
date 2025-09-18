package controllers

import (
	"encoding/json"
	"github.com/casibase/casibase/object"
)

// GetDynamicConfigs
// @Title GetDynamicConfigs
// @Tag DynamicConfig API
// @Description get all dynamic configs
// @Param   pageSize     query    string  false        "The size of each page"
// @Param   p     query    string  false        "The number of the page"
// @Success 200 {object} object.DynamicConfig The Response object
// @router /get-dynamic-configs [get]
func (c *ApiController) GetDynamicConfigs() {
	configs, err := object.GetDynamicConfigs()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(configs)
}

// GetDynamicConfig
// @Title GetDynamicConfig
// @Tag DynamicConfig API
// @Description get dynamic config
// @Param   id     query    string  true        "The id of the config"
// @Success 200 {object} object.DynamicConfig The Response object
// @router /get-dynamic-config [get]
func (c *ApiController) GetDynamicConfig() {
	id := c.Input().Get("id")
	config, err := object.GetDynamicConfig(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(config)
}

// AddDynamicConfig
// @Title AddDynamicConfig
// @Tag DynamicConfig API
// @Description add a dynamic config
// @Param   body    body   object.DynamicConfig  true        "The details of the config"
// @Success 200 {object} controllers.Response The Response object
// @router /add-dynamic-config [post]
func (c *ApiController) AddDynamicConfig() {
	var config object.DynamicConfig
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &config)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.Data["json"] = wrapActionResponse(object.AddDynamicConfig(&config))
	c.ServeJSON()
}

// UpdateDynamicConfig
// @Title UpdateDynamicConfig
// @Tag DynamicConfig API
// @Description update dynamic config
// @Param   id     query    string  true        "The id of the config"
// @Param   body    body   object.DynamicConfig  true        "The details of the config"
// @Success 200 {object} controllers.Response The Response object
// @router /update-dynamic-config [post]
func (c *ApiController) UpdateDynamicConfig() {
	id := c.Input().Get("id")
	var config object.DynamicConfig
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &config)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.Data["json"] = wrapActionResponse(object.UpdateDynamicConfig(id, &config))
	c.ServeJSON()
}

// DeleteDynamicConfig
// @Title DeleteDynamicConfig
// @Tag DynamicConfig API
// @Description delete a dynamic config
// @Param   body    body   object.DynamicConfig  true        "The details of the config"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-dynamic-config [post]
func (c *ApiController) DeleteDynamicConfig() {
	var config object.DynamicConfig
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &config)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.Data["json"] = wrapActionResponse(object.DeleteDynamicConfig(&config))
	c.ServeJSON()
}

