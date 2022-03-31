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

	beego.Router("/api/get-top-posts", &controllers.ApiController{}, "POST:GetTopPosts")
}
