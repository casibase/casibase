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
	ns := beego.NewNamespace("/api",
		beego.NSInclude(
			&controllers.ApiController{},
		),
	)
	beego.AddNamespace(ns)

	beego.Router("/api/get-topics", &controllers.ApiController{}, "GET:GetTopics")
	beego.Router("/api/get-topics-admin", &controllers.ApiController{}, "GET:GetTopicsAdmin")
	beego.Router("/api/get-topic", &controllers.ApiController{}, "GET:GetTopic")
	beego.Router("/api/get-topic-admin", &controllers.ApiController{}, "GET:GetTopicAdmin")
	beego.Router("/api/get-topic-by-urlpath-and-title", &controllers.ApiController{}, "GET:GetTopicByUrlPathAndTitle")
	// beego.Router("/api/update-topic", &controllers.ApiController{}, "POST:UpdateTopic") // no necessary to explore this api.
	beego.Router("/api/add-topic", &controllers.ApiController{}, "POST:AddTopic")
	beego.Router("/api/delete-topic", &controllers.ApiController{}, "POST:DeleteTopic")
	beego.Router("/api/translate-topic", &controllers.ApiController{}, "POST:TranslateTopic")
	beego.Router("/api/get-all-created-topics", &controllers.ApiController{}, "GET:GetAllCreatedTopics")
	beego.Router("/api/get-created-topics-num", &controllers.ApiController{}, "GET:GetCreatedTopicsNum")
	beego.Router("/api/get-topics-by-node", &controllers.ApiController{}, "GET:GetTopicsByNode")
	beego.Router("/api/get-topics-by-tab", &controllers.ApiController{}, "GET:GetTopicsByTab")
	beego.Router("/api/get-topics-by-tag", &controllers.ApiController{}, "GET:GetTopicsByTag")
	beego.Router("/api/get-topics-num", &controllers.ApiController{}, "GET:GetTopicsNum")
	beego.Router("/api/add-topic-hit-count", &controllers.ApiController{}, "POST:AddTopicHitCount")
	beego.Router("/api/get-hot-topic", &controllers.ApiController{}, "GET:GetHotTopic")
	beego.Router("/api/get-sorted-topics", &controllers.ApiController{}, "GET:GetSortedTopics")
	beego.Router("/api/add-topic-browse-record", &controllers.ApiController{}, "POST:AddTopicBrowseCount")
	beego.Router("/api/update-topic-node", &controllers.ApiController{}, "POST:UpdateTopicNode")
	beego.Router("/api/edit-content", &controllers.ApiController{}, "POST:EditContent")
	beego.Router("/api/top-topic", &controllers.ApiController{}, "POST:TopTopic")
	beego.Router("/api/cancel-top-topic", &controllers.ApiController{}, "POST:CancelTopTopic")
	beego.Router("/api/add-sensitive", &controllers.ApiController{}, "GET:AddSensitive")
	beego.Router("/api/del-sensitive", &controllers.ApiController{}, "GET:DelSensitive")
	beego.Router("/api/get-sensitive", &controllers.ApiController{}, "GET:GetSensitive")
	beego.Router("/api/upload-topic-pic", &controllers.ApiController{}, "POST:UploadTopicPic")
	beego.Router("/api/upload-file", &controllers.ApiController{}, "POST:UploadFile")
	beego.Router("/api/upload-moderator", &controllers.ApiController{}, "POST:ModeratorUpload")

	beego.Router("/api/get-replies", &controllers.ApiController{}, "GET:GetReplies")
	beego.Router("/api/get-replies-of-topic", &controllers.ApiController{}, "GET:GetAllRepliesOfTopic")
	beego.Router("/api/get-reply", &controllers.ApiController{}, "GET:GetReply")
	beego.Router("/api/update-reply", &controllers.ApiController{}, "POST:UpdateReply")
	beego.Router("/api/add-reply", &controllers.ApiController{}, "POST:AddReply")
	beego.Router("/api/delete-reply", &controllers.ApiController{}, "POST:DeleteReply")
	beego.Router("/api/get-latest-replies", &controllers.ApiController{}, "GET:GetLatestReplies")
	beego.Router("/api/get-member-replies-num", &controllers.ApiController{}, "GET:GetMemberRepliesNum")
	beego.Router("/api/get-reply-with-details", &controllers.ApiController{}, "GET:GetReplyWithDetails")

	beego.Router("/api/get-member", &controllers.ApiController{}, "GET:GetMember")
	beego.Router("/api/update-member-language", &controllers.ApiController{}, "POST:UpdateMemberLanguage")
	beego.Router("/api/get-member-language", &controllers.ApiController{}, "GET:GetMemberLanguage")
	beego.Router("/api/update-member-editor-type", &controllers.ApiController{}, "POST:UpdateMemberEditorType")
	beego.Router("/api/get-member-editor-type", &controllers.ApiController{}, "GET:GetMemberEditorType")
	beego.Router("/api/get-ranking-rich", &controllers.ApiController{}, "GET:GetRankingRich")
	beego.Router("/api/get-ranking-player", &controllers.ApiController{}, "GET:GetRankingPlayer")

	beego.Router("/api/update-poster", &controllers.ApiController{}, "POST:UpdatePoster") // Update poster api just for admin.
	beego.Router("/api/read-poster", &controllers.ApiController{}, "GET:ReadPoster")

	beego.Router("/api/update-translator", &controllers.ApiController{}, "POST:UpdateTranslator") // Update translator api just for admin.
	beego.Router("/api/add-translator", &controllers.ApiController{}, "POST:AddTranslator")       // Add translator api just for admin.
	beego.Router("/api/del-translator", &controllers.ApiController{}, "POST:DelTranslator")       // Delete translator api just for admin.
	beego.Router("/api/get-translator", &controllers.ApiController{}, "GET:GetTranslator")
	beego.Router("/api/visible-translator", &controllers.ApiController{}, "GET:VisibleTranslator")

	beego.Router("/api/get-nodes", &controllers.ApiController{}, "GET:GetNodes")
	beego.Router("/api/get-node", &controllers.ApiController{}, "GET:GetNode")
	beego.Router("/api/update-node", &controllers.ApiController{}, "POST:UpdateNode") // Update node api just for admin.
	beego.Router("/api/add-node", &controllers.ApiController{}, "POST:AddNode")       // Add node api just for admin.
	beego.Router("/api/delete-node", &controllers.ApiController{}, "POST:DeleteNode") // Delete node api just for admin.
	beego.Router("/api/get-node-info", &controllers.ApiController{}, "GET:GetNodeInfo")
	beego.Router("/api/get-node-relation", &controllers.ApiController{}, "GET:GetNodeRelation")
	beego.Router("/api/get-nodes-num", &controllers.ApiController{}, "GET:GetNodesNum")
	beego.Router("/api/get-latest-node", &controllers.ApiController{}, "GET:GetLatestNode")
	beego.Router("/api/get-hot-node", &controllers.ApiController{}, "GET:GetHotNode")
	beego.Router("/api/add-node-browse-record", &controllers.ApiController{}, "POST:AddNodeBrowseCount")
	beego.Router("/api/add-node-moderators", &controllers.ApiController{}, "POST:AddNodeModerators")
	beego.Router("/api/delete-node-moderators", &controllers.ApiController{}, "POST:DeleteNodeModerators")
	beego.Router("/api/get-nodes-admin", &controllers.ApiController{}, "GET:GetNodesAdmin")

	beego.Router("/api/signin", &controllers.ApiController{}, "POST:Signin")
	beego.Router("/api/signout", &controllers.ApiController{}, "POST:Signout")
	beego.Router("/api/get-account", &controllers.ApiController{}, "GET:GetAccount")

	beego.Router("/api/add-favorites", &controllers.ApiController{}, "POST:AddFavorites")
	beego.Router("/api/get-favorites", &controllers.ApiController{}, "GET:GetFavorites")
	beego.Router("/api/delete-favorites", &controllers.ApiController{}, "POST:DeleteFavorites")
	beego.Router("/api/get-favorites-status", &controllers.ApiController{}, "GET:GetFavoritesStatus")
	beego.Router("/api/get-account-favorite-num", &controllers.ApiController{}, "GET:GetAccountFavoriteNum")

	beego.Router("/api/get-tabs", &controllers.ApiController{}, "GET:GetTabs")
	beego.Router("/api/get-all-tabs", &controllers.ApiController{}, "GET:GetAllTabs")
	beego.Router("/api/get-tab-with-nodes", &controllers.ApiController{}, "GET:GetTabWithNodes")
	beego.Router("/api/get-tabs-admin", &controllers.ApiController{}, "GET:GetAllTabsAdmin")
	beego.Router("/api/get-tab-admin", &controllers.ApiController{}, "GET:GetTabAdmin")
	beego.Router("/api/add-tab", &controllers.ApiController{}, "POST:AddTab")       // Add tab api just for admin.
	beego.Router("/api/update-tab", &controllers.ApiController{}, "POST:UpdateTab") // Update tab api just for admin.
	beego.Router("/api/delete-tab", &controllers.ApiController{}, "POST:DeleteTab") // Delete tab api just for admin.

	beego.Router("/api/get-notifications", &controllers.ApiController{}, "GET:GetNotifications")
	beego.Router("/api/delete-notifications", &controllers.ApiController{}, "POST:DeleteNotification")
	beego.Router("/api/get-unread-notification-num", &controllers.ApiController{}, "GET:GetUnreadNotificationNum")
	beego.Router("/api/update-read-status", &controllers.ApiController{}, "POST:UpdateReadStatus")

	beego.Router("/api/get-plane", &controllers.ApiController{}, "GET:GetPlane")
	beego.Router("/api/get-plane-admin", &controllers.ApiController{}, "GET:GetPlaneAdmin")
	// beego.Router("/api/get-planes", &controllers.ApiController{}, "GET:GetPlanes")
	beego.Router("/api/add-plane", &controllers.ApiController{}, "POST:AddPlane") // Add plane api just for admin.
	beego.Router("/api/get-plane-list", &controllers.ApiController{}, "GET:GetPlaneList")
	beego.Router("/api/update-plane", &controllers.ApiController{}, "POST:UpdatePlane") // Update plane api just for admin.
	beego.Router("/api/get-planes-admin", &controllers.ApiController{}, "GET:GetPlanesAdmin")
	beego.Router("/api/delete-plane", &controllers.ApiController{}, "POST:DeletePlane") // Delete plane api just for admin.

	beego.Router("/api/get-checkin-bonus-status", &controllers.ApiController{}, "GET:GetCheckinBonusStatus")
	beego.Router("/api/get-checkin-bonus", &controllers.ApiController{}, "GET:GetCheckinBonus")
	beego.Router("/api/add-thanks", &controllers.ApiController{}, "POST:AddThanks")
	beego.Router("/api/get-consumption-record", &controllers.ApiController{}, "GET:GetConsumptionRecord")

	beego.Router("/api/get-files", &controllers.ApiController{}, "GET:GetFiles")
	beego.Router("/api/add-file-record", &controllers.ApiController{}, "POST:AddFileRecord")
	beego.Router("/api/delete-file", &controllers.ApiController{}, "POST:DeleteFile")
	beego.Router("/api/get-file", &controllers.ApiController{}, "GET:GetFile")
	beego.Router("/api/update-file-desc", &controllers.ApiController{}, "POST:UpdateFileDescribe")
	beego.Router("/api/get-file-num", &controllers.ApiController{}, "GET:GetFileNum")

	beego.Router("/api/update-hot-info", &controllers.ApiController{}, "POST:UpdateHotInfo")
	beego.Router("/api/update-expired-data", &controllers.ApiController{}, "POST:ChangeExpiredDataStatus")
	beego.Router("/api/get-community-health", &controllers.ApiController{}, "GET:GetCommunityHealth")
	beego.Router("/api/get-forum-version", &controllers.ApiController{}, "GET:GetForumVersion")
	beego.Router("/api/get-online-num", &controllers.ApiController{}, "GET:GetOnlineNum")
	beego.Router("/api/node-navigation", &controllers.ApiController{}, "GET:GetNodeNavigation")
	beego.Router("/api/search", &controllers.ApiController{}, "GET:Search")

	beego.Router("/api/get-front-conf-by-id", &controllers.ApiController{}, "GET:GetFrontConfById")
	beego.Router("/api/get-front-confs-by-field", &controllers.ApiController{}, "GET:GetFrontConfsByField")
	beego.Router("/api/update-front-conf-by-id", &controllers.ApiController{}, "POST:UpdateFrontConfById")
	beego.Router("/api/update-front-confs-by-field", &controllers.ApiController{}, "POST:UpdateFrontConfsByField")
	beego.Router("/api/restore-front-confs", &controllers.ApiController{}, "POST:RestoreFrontConfs")
}
