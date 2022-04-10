package routers

import (
	"github.com/astaxie/beego"
	"github.com/casbin/casbase/controllers"
)

func init() {
	initAPI()
}

func initAPI() {
	ns :=
		beego.NewNamespace("/api",
			beego.NSInclude(
				&controllers.ApiController{},
			),
		)
	beego.AddNamespace(ns)

	beego.Router("/api/signin", &controllers.ApiController{}, "POST:Signin")
	beego.Router("/api/signout", &controllers.ApiController{}, "POST:Signout")
	beego.Router("/api/get-account", &controllers.ApiController{}, "GET:GetAccount")

	beego.Router("/api/get-global-wordsets", &controllers.ApiController{}, "GET:GetGlobalWordsets")
	beego.Router("/api/get-wordsets", &controllers.ApiController{}, "GET:GetWordsets")
	beego.Router("/api/get-wordset", &controllers.ApiController{}, "GET:GetWordset")
	beego.Router("/api/get-wordset-graph", &controllers.ApiController{}, "GET:GetWordsetGraph")
	beego.Router("/api/update-wordset", &controllers.ApiController{}, "POST:UpdateWordset")
	beego.Router("/api/add-wordset", &controllers.ApiController{}, "POST:AddWordset")
	beego.Router("/api/delete-wordset", &controllers.ApiController{}, "POST:DeleteWordset")

	beego.Router("/api/get-global-vectorsets", &controllers.ApiController{}, "GET:GetGlobalVectorsets")
	beego.Router("/api/get-vectorsets", &controllers.ApiController{}, "GET:GetVectorsets")
	beego.Router("/api/get-vectorset", &controllers.ApiController{}, "GET:GetVectorset")
	beego.Router("/api/update-vectorset", &controllers.ApiController{}, "POST:UpdateVectorset")
	beego.Router("/api/add-vectorset", &controllers.ApiController{}, "POST:AddVectorset")
	beego.Router("/api/delete-vectorset", &controllers.ApiController{}, "POST:DeleteVectorset")
}
