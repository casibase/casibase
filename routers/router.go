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

	"github.com/casbin/casnode/controllers"
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

	beego.InsertFilter("/*", beego.BeforeRouter, FreshAccountActiveStatus)

	beego.Router("/api/get-topics", &controllers.APIController{}, "GET:GetTopics")
	beego.Router("/api/get-topics-admin", &controllers.APIController{}, "GET:GetTopicsAdmin")
	beego.Router("/api/get-topic", &controllers.APIController{}, "GET:GetTopic")
	beego.Router("/api/get-topic-admin", &controllers.APIController{}, "GET:GetTopicAdmin")
	//beego.Router("/api/update-topic", &controllers.APIController{}, "POST:UpdateTopic") // no necessary to explore this api.
	beego.Router("/api/add-topic", &controllers.APIController{}, "POST:AddTopic")
	beego.Router("/api/delete-topic", &controllers.APIController{}, "POST:DeleteTopic")
	beego.Router("/api/get-all-created-topics", &controllers.APIController{}, "GET:GetAllCreatedTopics")
	beego.Router("/api/get-created-topics-num", &controllers.APIController{}, "GET:GetCreatedTopicsNum")
	beego.Router("/api/get-topics-by-node", &controllers.APIController{}, "GET:GetTopicsByNode")
	beego.Router("/api/get-topics-by-tab", &controllers.APIController{}, "GET:GetTopicsByTab")
	beego.Router("/api/get-topics-num", &controllers.APIController{}, "GET:GetTopicsNum")
	beego.Router("/api/add-topic-hit-count", &controllers.APIController{}, "POST:AddTopicHitCount")
	beego.Router("/api/get-hot-topic", &controllers.APIController{}, "GET:GetHotTopic")
	beego.Router("/api/add-topic-browse-record", &controllers.APIController{}, "POST:AddTopicBrowseCount")
	beego.Router("/api/update-topic-node", &controllers.APIController{}, "POST:UpdateTopicNode")
	beego.Router("/api/edit-content", &controllers.APIController{}, "POST:EditContent")
	beego.Router("/api/top-topic", &controllers.APIController{}, "POST:TopTopic")
	beego.Router("/api/cancel-top-topic", &controllers.APIController{}, "POST:CancelTopTopic")
	beego.Router("/api/add-sensitive", &controllers.APIController{}, "GET:AddSensitive")
	beego.Router("/api/del-sensitive", &controllers.APIController{}, "GET:DelSensitive")
	beego.Router("/api/get-sensitive", &controllers.APIController{}, "GET:GetSensitive")
	beego.Router("/api/upload-topic-pic", &controllers.APIController{}, "POST:UploadTopicPic")
	beego.Router("/api/upload-file", &controllers.APIController{}, "POST:UploadFile")
	beego.Router("/api/upload-avatar", &controllers.APIController{}, "POST:UploadAvatar")

	beego.Router("/api/get-replies", &controllers.APIController{}, "GET:GetReplies")
	beego.Router("/api/get-replies-of-topic", &controllers.APIController{}, "GET:GetAllRepliesOfTopic")
	beego.Router("/api/get-reply", &controllers.APIController{}, "GET:GetReply")
	beego.Router("/api/update-reply", &controllers.APIController{}, "POST:UpdateReply")
	beego.Router("/api/add-reply", &controllers.APIController{}, "POST:AddReply")
	beego.Router("/api/delete-reply", &controllers.APIController{}, "POST:DeleteReply")
	beego.Router("/api/get-latest-replies", &controllers.APIController{}, "GET:GetLatestReplies")
	beego.Router("/api/get-member-replies-num", &controllers.APIController{}, "GET:GetMemberRepliesNum")
	beego.Router("/api/get-reply-with-details", &controllers.APIController{}, "GET:GetReplyWithDetails")

	beego.Router("/api/get-members", &controllers.APIController{}, "GET:GetMembers")
	beego.Router("/api/get-members-admin", &controllers.APIController{}, "GET:GetMembersAdmin")
	beego.Router("/api/get-member", &controllers.APIController{}, "GET:GetMember")
	beego.Router("/api/get-member-admin", &controllers.APIController{}, "GET:GetMemberAdmin")
	beego.Router("/api/update-member", &controllers.APIController{}, "POST:UpdateMember") // Update member api just for admin.
	beego.Router("/api/add-member", &controllers.APIController{}, "POST:AddMember")
	//beego.Router("/api/delete-member", &controllers.APIController{}, "POST:DeleteMember") // Change this api to update member.
	beego.Router("/api/update-member-info", &controllers.APIController{}, "POST:UpdateMemberInfo")
	beego.Router("/api/get-member-avatar", &controllers.APIController{}, "GET:GetMemberAvatar")
	beego.Router("/api/update-member-avatar", &controllers.APIController{}, "POST:UpdateMemberAvatar")
	beego.Router("/api/update-member-language", &controllers.APIController{}, "POST:UpdateMemberLanguage")
	beego.Router("/api/get-member-language", &controllers.APIController{}, "GET:GetMemberLanguage")
	beego.Router("/api/update-member-editor-type", &controllers.APIController{}, "POST:UpdateMemberEditorType")
	beego.Router("/api/get-member-editor-type", &controllers.APIController{}, "GET:GetMemberEditorType")
	beego.Router("/api/update-member-email-reminder", &controllers.APIController{}, "POST:UpdateMemberEmailReminder")
	beego.Router("/api/get-ranking-rich", &controllers.APIController{}, "GET:GetRankingRich")

	beego.Router("/api/get-nodes", &controllers.APIController{}, "GET:GetNodes")
	beego.Router("/api/get-node", &controllers.APIController{}, "GET:GetNode")
	beego.Router("/api/update-node", &controllers.APIController{}, "POST:UpdateNode") // Update node api just for admin.
	beego.Router("/api/add-node", &controllers.APIController{}, "POST:AddNode")       // Add node api just for admin.
	beego.Router("/api/delete-node", &controllers.APIController{}, "POST:DeleteNode") // Delete node api just for admin.
	beego.Router("/api/get-node-info", &controllers.APIController{}, "GET:GetNodeInfo")
	beego.Router("/api/get-node-relation", &controllers.APIController{}, "GET:GetNodeRelation")
	beego.Router("/api/get-nodes-num", &controllers.APIController{}, "GET:GetNodesNum")
	beego.Router("/api/get-latest-node", &controllers.APIController{}, "GET:GetLatestNode")
	beego.Router("/api/get-hot-node", &controllers.APIController{}, "GET:GetHotNode")
	beego.Router("/api/add-node-browse-record", &controllers.APIController{}, "POST:AddNodeBrowseCount")
	beego.Router("/api/add-node-moderators", &controllers.APIController{}, "POST:AddNodeModerators")
	beego.Router("/api/delete-node-moderators", &controllers.APIController{}, "POST:DeleteNodeModerators")
	beego.Router("/api/get-nodes-admin", &controllers.APIController{}, "GET:GetNodesAdmin")

	beego.Router("/api/signup", &controllers.APIController{}, "POST:Signup")
	beego.Router("/api/signin", &controllers.APIController{}, "POST:Signin")
	beego.Router("/api/signout", &controllers.APIController{}, "POST:Signout")
	beego.Router("/api/get-account", &controllers.APIController{}, "GET:GetAccount")
	beego.Router("/api/auth/google", &controllers.APIController{}, "GET:AuthGoogle")
	beego.Router("/api/auth/github", &controllers.APIController{}, "GET:AuthGithub")
	beego.Router("/api/auth/qq", &controllers.APIController{}, "GET:AuthQQ")
	beego.Router("/api/auth/wechat", &controllers.APIController{}, "GET:AuthWeChat")
	beego.Router("/api/reset-password", &controllers.APIController{}, "POST:ResetPassword")

	beego.Router("/api/add-favorites", &controllers.APIController{}, "POST:AddFavorites")
	beego.Router("/api/get-favorites", &controllers.APIController{}, "GET:GetFavorites")
	beego.Router("/api/delete-favorites", &controllers.APIController{}, "POST:DeleteFavorites")
	beego.Router("/api/get-favorites-status", &controllers.APIController{}, "GET:GetFavoritesStatus")
	beego.Router("/api/get-account-favorite-num", &controllers.APIController{}, "GET:GetAccountFavoriteNum")

	beego.Router("/api/get-tabs", &controllers.APIController{}, "GET:GetTabs")
	beego.Router("/api/get-all-tabs", &controllers.APIController{}, "GET:GetAllTabs")
	beego.Router("/api/get-tab-with-nodes", &controllers.APIController{}, "GET:GetTabWithNodes")
	beego.Router("/api/get-tabs-admin", &controllers.APIController{}, "GET:GetAllTabsAdmin")
	beego.Router("/api/get-tab-admin", &controllers.APIController{}, "GET:GetTabAdmin")
	beego.Router("/api/add-tab", &controllers.APIController{}, "POST:AddTab")       // Add tab api just for admin.
	beego.Router("/api/update-tab", &controllers.APIController{}, "POST:UpdateTab") // Update tab api just for admin.
	beego.Router("/api/delete-tab", &controllers.APIController{}, "POST:DeleteTab") // Delete tab api just for admin.

	beego.Router("/api/get-notifications", &controllers.APIController{}, "GET:GetNotifications")
	beego.Router("/api/delete-notifications", &controllers.APIController{}, "POST:DeleteNotification")
	beego.Router("/api/get-unread-notification-num", &controllers.APIController{}, "GET:GetUnreadNotificationNum")
	beego.Router("/api/update-read-status", &controllers.APIController{}, "POST:UpdateReadStatus")

	beego.Router("/api/get-plane", &controllers.APIController{}, "GET:GetPlane")
	beego.Router("/api/get-plane-admin", &controllers.APIController{}, "GET:GetPlaneAdmin")
	//beego.Router("/api/get-planes", &controllers.APIController{}, "GET:GetPlanes")
	beego.Router("/api/add-plane", &controllers.APIController{}, "POST:AddPlane") // Add plane api just for admin.
	beego.Router("/api/get-plane-list", &controllers.APIController{}, "GET:GetPlaneList")
	beego.Router("/api/update-plane", &controllers.APIController{}, "POST:UpdatePlane") // Update plane api just for admin.
	beego.Router("/api/get-planes-admin", &controllers.APIController{}, "GET:GetPlanesAdmin")
	beego.Router("/api/delete-plane", &controllers.APIController{}, "POST:DeletePlane") // Delete plane api just for admin.

	beego.Router("/api/get-checkin-bonus-status", &controllers.APIController{}, "GET:GetCheckinBonusStatus")
	beego.Router("/api/get-checkin-bonus", &controllers.APIController{}, "GET:GetCheckinBonus")
	beego.Router("/api/add-thanks", &controllers.APIController{}, "POST:AddThanks")
	beego.Router("/api/get-consumption-record", &controllers.APIController{}, "GET:GetConsumptionRecord")

	beego.Router("/api/get-files", &controllers.APIController{}, "GET:GetFiles")
	beego.Router("/api/add-file-record", &controllers.APIController{}, "POST:AddFileRecord")
	beego.Router("/api/delete-file", &controllers.APIController{}, "POST:DeleteFile")
	beego.Router("/api/get-file", &controllers.APIController{}, "GET:GetFile")
	beego.Router("/api/update-file-desc", &controllers.APIController{}, "POST:UpdateFileDescribe")
	beego.Router("/api/get-file-num", &controllers.APIController{}, "GET:GetFileNum")

	beego.Router("/api/update-hot-info", &controllers.APIController{}, "POST:UpdateHotInfo")
	beego.Router("/api/update-expired-data", &controllers.APIController{}, "POST:ChangeExpiredDataStatus")
	beego.Router("/api/get-captcha", &controllers.APIController{}, "GET:GetCaptcha")
	beego.Router("/api/get-validate-code", &controllers.APIController{}, "GET:GetValidateCode")
	beego.Router("/api/get-community-health", &controllers.APIController{}, "GET:GetCommunityHealth")
	beego.Router("/api/get-forum-version", &controllers.APIController{}, "GET:GetForumVersion")
	beego.Router("/api/get-online-num", &controllers.APIController{}, "GET:GetOnlineNum")
	beego.Router("/api/node-navigation", &controllers.APIController{}, "GET:GetNodeNavigation")
}
