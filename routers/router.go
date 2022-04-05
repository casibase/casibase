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

	beego.Router("/api/get-global-datasets", &controllers.ApiController{}, "GET:GetGlobalDatasets")
	beego.Router("/api/get-datasets", &controllers.ApiController{}, "GET:GetDatasets")
	beego.Router("/api/get-dataset", &controllers.ApiController{}, "GET:GetDataset")
	beego.Router("/api/get-dataset-graph", &controllers.ApiController{}, "GET:GetDatasetGraph")
	beego.Router("/api/update-dataset", &controllers.ApiController{}, "POST:UpdateDataset")
	beego.Router("/api/add-dataset", &controllers.ApiController{}, "POST:AddDataset")
	beego.Router("/api/delete-dataset", &controllers.ApiController{}, "POST:DeleteDataset")
}
