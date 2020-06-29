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
	beego.Router("/api/get-all-created-topics", &controllers.APIController{}, "GET:GetAllCreatedTopics")
	beego.Router("/api/get-topics-by-node", &controllers.APIController{}, "GET:GetTopicsByNode")

	beego.Router("/api/get-replies", &controllers.APIController{}, "GET:GetReplies")
	beego.Router("/api/get-reply", &controllers.APIController{}, "GET:GetReply")
	beego.Router("/api/update-reply", &controllers.APIController{}, "POST:UpdateReply")
	beego.Router("/api/add-reply", &controllers.APIController{}, "POST:AddReply")
	beego.Router("/api/delete-reply", &controllers.APIController{}, "POST:DeleteReply")
	beego.Router("/api/get-latest-replies", &controllers.APIController{}, "GET:GetLatestReplies")

	beego.Router("/api/get-members", &controllers.APIController{}, "GET:GetMembers")
	beego.Router("/api/get-member", &controllers.APIController{}, "GET:GetMember")
	beego.Router("/api/update-member", &controllers.APIController{}, "POST:UpdateMember")
	beego.Router("/api/add-member", &controllers.APIController{}, "POST:AddMember")
	beego.Router("/api/delete-member", &controllers.APIController{}, "POST:DeleteMember")
	
	beego.Router("/api/get-nodes", &controllers.APIController{}, "GET:GetNodes")
	beego.Router("/api/get-node", &controllers.APIController{}, "GET:GetNode")
	beego.Router("/api/update-node", &controllers.APIController{}, "POST:UpdateNode")
	beego.Router("/api/add-node", &controllers.APIController{}, "POST:AddNode")
	beego.Router("/api/delete-node", &controllers.APIController{}, "POST:DeleteNode")
	beego.Router("/api/get-node-info", &controllers.APIController{}, "GET:GetNodeInfo")

	beego.Router("/api/signup", &controllers.APIController{}, "POST:Signup")
	beego.Router("/api/signin", &controllers.APIController{}, "POST:Signin")
	beego.Router("/api/signout", &controllers.APIController{}, "POST:Signout")
	beego.Router("/api/get-account", &controllers.APIController{}, "GET:GetAccount")
  beego.Router("/api/auth/google", &controllers.APIController{}, "GET:AuthGoogle")
  
	beego.Router("/api/add-favorites", &controllers.APIController{}, "POST:AddFavorites")
	beego.Router("/api/get-favorites", &controllers.APIController{}, "GET:GetFavorites")
	beego.Router("/api/delete-favorites", &controllers.APIController{}, "POST:DeleteFavorites")
	beego.Router("/api/get-favorites-status", &controllers.APIController{}, "GET:GetFavoritesStatus")
	
}
