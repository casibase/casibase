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
	beego.Router("/api/get-wordset-match", &controllers.ApiController{}, "GET:GetWordsetMatch")
	beego.Router("/api/update-wordset", &controllers.ApiController{}, "POST:UpdateWordset")
	beego.Router("/api/add-wordset", &controllers.ApiController{}, "POST:AddWordset")
	beego.Router("/api/delete-wordset", &controllers.ApiController{}, "POST:DeleteWordset")

	beego.Router("/api/get-global-vectorsets", &controllers.ApiController{}, "GET:GetGlobalVectorsets")
	beego.Router("/api/get-vectorsets", &controllers.ApiController{}, "GET:GetVectorsets")
	beego.Router("/api/get-vectorset", &controllers.ApiController{}, "GET:GetVectorset")
	beego.Router("/api/update-vectorset", &controllers.ApiController{}, "POST:UpdateVectorset")
	beego.Router("/api/add-vectorset", &controllers.ApiController{}, "POST:AddVectorset")
	beego.Router("/api/delete-vectorset", &controllers.ApiController{}, "POST:DeleteVectorset")

	beego.Router("/api/get-global-videos", &controllers.ApiController{}, "GET:GetGlobalVideos")
	beego.Router("/api/get-videos", &controllers.ApiController{}, "GET:GetVideos")
	beego.Router("/api/get-video", &controllers.ApiController{}, "GET:GetVideo")
	beego.Router("/api/update-video", &controllers.ApiController{}, "POST:UpdateVideo")
	beego.Router("/api/add-video", &controllers.ApiController{}, "POST:AddVideo")
	beego.Router("/api/delete-video", &controllers.ApiController{}, "POST:DeleteVideo")

	beego.Router("/api/get-global-stores", &controllers.ApiController{}, "GET:GetGlobalStores")
	beego.Router("/api/get-stores", &controllers.ApiController{}, "GET:GetStores")
	beego.Router("/api/get-store", &controllers.ApiController{}, "GET:GetStore")
	beego.Router("/api/update-store", &controllers.ApiController{}, "POST:UpdateStore")
	beego.Router("/api/add-store", &controllers.ApiController{}, "POST:AddStore")
	beego.Router("/api/delete-store", &controllers.ApiController{}, "POST:DeleteStore")

	beego.Router("/api/update-file", &controllers.ApiController{}, "POST:UpdateFile")
	beego.Router("/api/add-file", &controllers.ApiController{}, "POST:AddFile")
	beego.Router("/api/delete-file", &controllers.ApiController{}, "POST:DeleteFile")
	beego.Router("/api/activate-file", &controllers.ApiController{}, "POST:ActivateFile")
	beego.Router("/api/get-active-file", &controllers.ApiController{}, "GET:GetActiveFile")

	beego.Router("/api/get-permissions", &controllers.ApiController{}, "GET:GetPermissions")
	beego.Router("/api/get-permission", &controllers.ApiController{}, "GET:GetPermission")
	beego.Router("/api/update-permission", &controllers.ApiController{}, "POST:UpdatePermission")
	beego.Router("/api/add-permission", &controllers.ApiController{}, "POST:AddPermission")
	beego.Router("/api/delete-permission", &controllers.ApiController{}, "POST:DeletePermission")
}
