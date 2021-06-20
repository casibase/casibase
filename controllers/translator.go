package controllers

import (
	"encoding/json"
	"github.com/casbin/casnode/object"
)

func (c *ApiController) UpdateTranslator() {
	var resp Response
	if !object.CheckModIdentity(c.GetSessionUsername()) {
		resp = Response{Status: "fail", Msg: "Unauthorized."}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}
	var translator object.Translator
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &translator)
	if err != nil {
		panic(err)
	}
	object.UpdateTranslator(translator)

	c.Data["json"] = Response{Status: "ok", Msg: "success"}
	c.ServeJSON()
}

func (c *ApiController) AddTranslator() {
	var resp Response
	if !object.CheckModIdentity(c.GetSessionUsername()) {
		resp = Response{Status: "fail", Msg: "Unauthorized."}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}
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
		resp = Response{Status: "ok", Msg: "Success"}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	} else {
		resp = Response{Status: "fail", Msg: "Add translator failed"}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}
}

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

func (c *ApiController) VisibleTranslator() {
	resp := Response{Status: "ok", Data: false}

	res := object.GetEnableTranslator()
	if res != nil {
		if res.Visible {
			resp = Response{Status: "ok", Data: true}
		}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) DelTranslator() {
	id := c.Input().Get("id")
	resp := Response{Status: "fail", Msg: "Delete translator failed"}
	if object.DelTranslator(id) {
		resp = Response{Status: "ok", Msg: "Success"}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}
