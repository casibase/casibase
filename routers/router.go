// Copyright 2020 The casbin Authors. All Rights Reserved.
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

package routers

import (
	"github.com/astaxie/beego"

	"github.com/casbin/casbin-forum/controllers"
)

func init() {
	initAPI()
}

func initAPI() {
	ns :=
		beego.NewNamespace("/api",
			beego.NSInclude(
				&controllers.APIController{},
			),
		)
	beego.AddNamespace(ns)

	beego.Router("/api/get-topics", &controllers.APIController{}, "GET:GetTopics")
	beego.Router("/api/get-topic", &controllers.APIController{}, "GET:GetTopic")
	beego.Router("/api/update-topic", &controllers.APIController{}, "POST:UpdateTopic")
	beego.Router("/api/add-topic", &controllers.APIController{}, "POST:AddTopic")
	beego.Router("/api/delete-topic", &controllers.APIController{}, "POST:DeleteTopic")
	
	beego.Router("/api/get-boards", &controllers.APIController{}, "GET:GetBoards")
	beego.Router("/api/get-board", &controllers.APIController{}, "GET:GetBoard")
	beego.Router("/api/update-board", &controllers.APIController{}, "POST:UpdateBoard")
	beego.Router("/api/add-board", &controllers.APIController{}, "POST:AddBoard")
	beego.Router("/api/delete-board", &controllers.APIController{}, "POST:DeleteBoard")
}
