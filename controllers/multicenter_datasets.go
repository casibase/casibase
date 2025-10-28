// Copyright 2025 The Casibase Authors. All Rights Reserved.
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

package controllers

import (
	"encoding/json"
	"strings"

    "github.com/casibase/casibase/object"
    "github.com/casibase/casibase/util"
)

// GetDatasets
// @Title GetDatasets
// @Tag Multicenter Dataset API
// @Description get datasets (optionally by owner)
// @Param   owner     query    string  false        "The owner"
// @Success 200 {object} object.MulticenterDatasets The Response object
// @router /get-datasets [get]
func (c *ApiController) GetDatasets() {
    // owner should come from session (do not trust external owner param)
    owner := c.GetSessionUsername()
	if owner == "" {
		c.ResponseError("Please login first")
		return
	}
    datasets, err := object.GetDatasets(owner)
    if err != nil {
        c.ResponseError(err.Error())
        return
    }
    c.ResponseOk(datasets)
}

// GetDataset
// @Title GetDataset
// @Tag Multicenter Dataset API
// @Description get dataset by id
// @Param   id     query    string  true        "The id (numeric) of the dataset"
// @Success 200 {object} object.MulticenterDatasets The Response object
// @router /get-dataset-by-id [get]
func (c *ApiController) GetDatasetById() {
    idStr := c.Input().Get("id")
    id := util.ParseInt(idStr)
    ds, err := object.GetDatasetById(id)
    if err != nil {
        c.ResponseError(err.Error())
        return
    }
    c.ResponseOk(ds)
}

// AddDataset
// @Title AddDataset
// @Tag Multicenter Dataset API
// @Description add a dataset
// @Param   body    body   object.MulticenterDatasets  true        "The details of the dataset"
// @Success 200 {object} controllers.Response The Response object
// @router /add-dataset [post]
func (c *ApiController) AddDataset() {
	var ds object.MulticenterDatasets
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &ds)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	// owner must be current session user
	ds.Owner = c.GetSessionUsername()
	if ds.Owner == "" {
		c.ResponseError("Please login first")
		return
	}
	unit := c.GetSessionUserAffiliation()
	if unit == "" {
		c.ResponseError("您的工作单位信息为空，请联系管理员设置")
		return
	}
	ds.Unit = unit

	flag, err := object.AddDataset(&ds)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(flag)
}

// UpdateDataset
// @Title UpdateDataset
// @Tag Multicenter Dataset API
// @Description update dataset
// @Param   id     query    string  true        "The id (numeric) of the dataset"
// @Param   body    body   object.MulticenterDatasets  true        "The details of the dataset"
// @Success 200 {object} controllers.Response The Response object
// @router /update-dataset [post]
func (c *ApiController) UpdateDataset() {
    idStr := c.Input().Get("id")
    id := util.ParseInt(idStr)
    var ds object.MulticenterDatasets
    err := json.Unmarshal(c.Ctx.Input.RequestBody, &ds)
    if err != nil {
        c.ResponseError(err.Error())
        return
    }
    username := c.GetSessionUsername()
	if username == "" {
		c.ResponseError("You should login first")
		return
	}
	flag , err := object.UpdateDataset(id, username, &ds)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
    c.ResponseOk(flag)
}

// /search-dataset-market
func (c *ApiController) SearchDatasetMarket() { 
	query := c.Input().Get("query")
	username := c.GetSessionUsername()
	if username == "" {
		c.ResponseError("Please login first")
		return
	}
	// query去掉空格
	query = strings.TrimSpace(query)
	datasets, err := object.SearchDatasetMarket(username, query)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(datasets)
}

// AddAccessRequest
// @Title AddAccessRequest
// @Tag Multicenter Dataset API
// @Description create an access request
// @Param   body    body   object.MulticenterDatasetsAccessrequests  true        "The details of the access request"
// @Success 200 {object} controllers.Response The Response object
// @router /add-access-request [post]
func (c *ApiController) AddAccessRequest() {
    var req object.MulticenterDatasetsAccessrequests
    err := json.Unmarshal(c.Ctx.Input.RequestBody, &req)
    if err != nil {
        c.ResponseError(err.Error())
        return
    }
    // requester must be current user (ignore any provided requester)
    req.Requester = c.GetSessionUsername()
	if req.Requester == "" {
		c.ResponseError("Please login first")
		return
	}
	flag,err := object.AddAccessRequest(&req)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
    c.ResponseOk(flag)
}

// /get-access-request-by-id-and-cur-user
func (c *ApiController) GetAccessRequestByIdAndCurrentUser() { 
	idStr := c.Input().Get("id")
	idInt, err := util.ParseIntWithError(idStr)
	username := c.GetSessionUsername()
	if username == "" {
		c.ResponseError("Please login first")
		return
	}
	req, err := object.GetAccessRequestByIdAndUser(idInt, username)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(req)
}



// /get-access-request-by-reviewer-and-status
func (c *ApiController) GetAccessRequestByReviewerAndStatus() {
	reviewer := c.GetSessionUsername()
	status := c.Input().Get("status")
	if reviewer == "" {
		c.ResponseError("Please login first")
		return
	}
	reqs, err := object.GetAccessRequestByReviewerAndStatus(reviewer, status)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(reqs)
}

// /get-access-request-by-requester-and-status
func (c *ApiController) GetAccessRequestByRequesterAndStatus() {
	requester := c.GetSessionUsername()
	status := c.Input().Get("status")
	if requester == "" {
		c.ResponseError("Please login first")
		return
	}
	reqs, err := object.GetAccessRequestByRequesterAndStatus(requester, status)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(reqs)
}

// CancelAccessRequest
// @Title CancelAccessRequest
// @Tag Multicenter Dataset API
// @Description cancel an access request
// @Param   id     query    string  true        "The request id"
// @Success 200 {object} controllers.Response The Response object
// @router /cancel-access-request [post]
func (c *ApiController) CancelAccessRequest() {
    idStr := c.Input().Get("id")
    id := util.ParseInt(idStr)
    username := c.GetSessionUsername()
	if username == "" {
		c.ResponseError("you are not admin")
		return
	}
	flag, err := object.CancelAccessRequest(id, username)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
    c.ResponseOk(flag)
}

// ReviewAccessRequest
// @Title ReviewAccessRequest
// @Tag Multicenter Dataset API
// @Description approve or reject an access request
// @Param   id     query    string  true        "The request id"
// @Param   approved     query    string  true        "true/false"
// @Param   comment     query    string  false        "review comment"
// @Success 200 {object} controllers.Response The Response object
// @router /review-access-request [post]
func (c *ApiController) ReviewAccessRequest() {
    idStr := c.Input().Get("id")
    id := util.ParseInt(idStr)
    approvedStr := c.Input().Get("approved")
    approved := false
    if approvedStr == "true" || approvedStr == "1" {
        approved = true
    }
    comment := c.Input().Get("comment")
    reviewer := c.GetSessionUsername()
	if reviewer == "" {
		c.ResponseError("Please login first")
		return
	}
    c.ResponseOk(object.PassOrRejectAccessRequest(id, reviewer, comment, approved))
}

// GetGrantsByRequest
// @Title GetGrantsByRequest
// @Tag Multicenter Dataset API
// @Description get grants by request id (current user filtered)
// @Param   requestId     query    string  true        "The request id"
// @Success 200 {object} object.AssetGrant The Response object
// @router /get-grants-by-grantedId [get]
func (c *ApiController) GetAssetGrantByIdAndUser() {
    grantedIdStr := c.Input().Get("grantedId")
    grantedId := util.ParseInt(grantedIdStr)
    username := c.GetSessionUsername()
    grants, err := object.GetAssetGrantByIdAndUser(grantedId, username)
    if err != nil {
        c.ResponseError(err.Error())
        return
    }
    c.ResponseOk(grants)
}

// GetGrantsByOwner
// @Title GetGrantsByOwner
// @Tag Multicenter Dataset API
// @Description get grants by asset id and owner
// @Param   assetId     query    string  true        "The asset id"
// @Success 200 {object} object.AssetGrant The Response object
// @router /get-granted-assets-by-owner [get]
func (c *ApiController) GetGrantedAssetsByOwner() {
	
	owner := c.GetSessionUsername()
	if owner == "" {
		c.ResponseError("Please login first")
		return
	}
	grants, err := object.GetGrantedAssetsByOwner(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(grants)
}

// /get-granted-assets-by-requester
func (c *ApiController) GetGrantedAssetsByRequester() {
	requester := c.GetSessionUsername()
	if requester == "" {
		c.ResponseError("Please login first")
		return
	}
	grants, err := object.GetGrantedAssetsByRequester(requester)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(grants)
}
