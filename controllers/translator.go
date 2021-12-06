package controllers

import (
	"encoding/json"

	"github.com/casbin/casnode/object"
)

// @router /update-translator [post]
// @Title UpdateTranslator
// @Tag Translator API
func (c *ApiController) UpdateTranslator() {
	if c.RequireAdmin() {
		return
	}

	var translator object.Translator
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &translator)
	if err != nil {
		panic(err)
	}
	object.UpdateTranslator(translator)

	c.ResponseOk()
}

// @router /add-translator [post]
// @Title AddTranslator
// @Tag Translator API
func (c *ApiController) AddTranslator() {
	if c.RequireAdmin() {
		return
	}

	var resp Response
	var translator object.Translator
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &translator)
	if err != nil {
		panic(err)
	}

	res := object.GetTranslator(translator.Id)
	if len(*res) > 0 {
		resp = Response{Status: "fail", Msg: "Translator ID existed"}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	if object.AddTranslator(translator) {
		c.ResponseOk()
		return
	} else {
		resp = Response{Status: "fail", Msg: "Add translator failed"}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}
}

// @router /get-translator [get]
// @Title GetTranslator
// @Tag Translator API
func (c *ApiController) GetTranslator() {
	id := c.Input().Get("id")
	res := object.GetTranslator(id)

	c.Data["json"] = res
	c.ServeJSON()
}

func (c *ApiController) GetEnableTranslator() {
	res := object.GetEnableTranslator()

	c.Data["json"] = res
	c.ServeJSON()
}

// @router /visible-translator [get]
// @Title VisibleTranslator
// @Tag Translator API
func (c *ApiController) VisibleTranslator() {
	c.ResponseOk(false)

	res := object.GetEnableTranslator()
	if res != nil {
		if res.Visible {
			c.ResponseOk(true)
		}
	}
}

// @router /del-translator [post]
// @Title DelTranslator
// @Tag Translator API
func (c *ApiController) DelTranslator() {
	id := c.Input().Get("id")
	resp := Response{Status: "fail", Msg: "Delete translator failed"}
	if object.DelTranslator(id) {
		resp = Response{Status: "ok", Msg: "Success"}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}
