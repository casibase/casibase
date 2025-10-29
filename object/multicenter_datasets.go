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

package object

import (
	"errors"
	"fmt"
	"strings"
	"time"
	"mime/multipart"
	"strconv"
	"encoding/json"
	"io/ioutil"
    "net/http"
	"bytes"

	"xorm.io/core"
)

var accessReqStatusMap = map[string]string{
    "PENDING":   "PENDING",
    "APPROVED":  "APPROVED",
    "REJECTED":  "REJECTED",
    "CANCELLED": "CANCELLED",
}

var accessGrantStatusMap = map[string]string{
    "GRANTED": "GRANTED",
    "REVOKED": "REVOKED",
}

var datasetVisibleStatusMap = map[string]string{
    "PUBLIC":  "PUBLIC",
	"PRIVATE": "PRIVATE",
}


func ensureDataDefault(s *string) {
	const epochDefault = "1970-01-01 00:00:00"
    if s == nil {
        return
    }
    if strings.TrimSpace(*s) == "" {
        *s = epochDefault
    }
}

// MulticenterDatasets represents an entry in multicenter_datasets table
type MulticenterDatasets struct {
    Id          int    `xorm:"int notnull pk autoincr" json:"id"`
    Owner       string `xorm:"varchar(255) index" json:"owner"`
    DatasetName string `xorm:"varchar(255) index" json:"datasetName"`
    Description string `xorm:"text" json:"description"`
    Unit       string `xorm:"varchar(255)" json:"unit"`
    VisibleStatus string `xorm:"varchar(20)" json:"visibleStatus"`
    Keyword     string `xorm:"varchar(200)" json:"keyword"`
    CreatedAt   string `xorm:"varchar(100)" json:"createdAt"`
    UpdatedAt   string `xorm:"varchar(100)" json:"updatedAt"`
    ExpiredAt   string `xorm:"varchar(100)" json:"expiredAt"`
}

// MulticenterDatasetsAccessrequests represents an access request to a dataset
type MulticenterDatasetsAccessrequests struct {
    RequestId            int    `xorm:"int notnull pk autoincr" json:"requestId"`
    AssetId              int    `xorm:"int index" json:"assetId"`
    Requester            string `xorm:"varchar(255)" json:"requester"`
    Reviewer             string `xorm:"varchar(255)" json:"reviewer"`
    RequestedAccessCount int    `xorm:"int" json:"requestedAccessCount"`
    RequestedDeadline    string `xorm:"varchar(100)" json:"requestedDeadline"`
    RequestReason        string `xorm:"text" json:"requestReason"`
    RequestStatus        string `xorm:"varchar(20)" json:"requestStatus"`
    ReviewComment        string `xorm:"text" json:"reviewComment"`
    RequestedAt          string `xorm:"varchar(100)" json:"requestedAt"`
    ReviewedAt           string `xorm:"varchar(100)" json:"reviewedAt"`
}

// MulticenterDatasetsAssetGrants represents a granted access for a dataset
type MulticenterDatasetsAssetGrants struct {
    GrantId    int    `xorm:"int notnull pk autoincr" json:"grantId"`
    RequestId  int    `xorm:"int" json:"requestId"`
    AssetId    int    `xorm:"int index" json:"assetId"`
    Requester  string `xorm:"varchar(255)" json:"requester"`
    Owner      string `xorm:"varchar(255)" json:"owner"`
    AccessCount int   `xorm:"int" json:"accessCount"`
    Deadline   string `xorm:"varchar(100)" json:"deadline"`
    GrantStatus string `xorm:"varchar(20)" json:"grantStatus"`
}

type MulticenterDatasetsRecords struct {
    /**
	id INT PRIMARY KEY AUTO_INCREMENT,
    record_id INT NOT NULL,
    keyword VARCHAR(255) NOT NULL,
    unit VARCHAR(255) NOT NULL,
    object VARCHAR(4096) NOT NULL
	*/
	Id       int    `xorm:"int notnull pk autoincr" json:"id"`
	RecordId int    `xorm:"int index" json:"recordId"`
	Keyword  string `xorm:"varchar(255)" json:"keyword"`
	Unit     string `xorm:"varchar(255)" json:"unit"`
	Object   string `xorm:"text" json:"object"`
}

type MulticenterDatasetsAndAssetGrants_TOGETHER struct {
	AccessGrant MulticenterDatasetsAssetGrants `json:"accessGrant"`
	Dataset     MulticenterDatasets                 `json:"dataset"`
}

// --- MulticenterDatasets CRUD ---



func GetDatasets(owner string) ([]*MulticenterDatasets, error) {
    datasets := []*MulticenterDatasets{}
    err := adapter.engine.Desc("id").Find(&datasets, &MulticenterDatasets{Owner: owner})
    if err != nil {
        return datasets, err
    }
    return datasets, nil
}


func GetDatasetById(id int)(*MulticenterDatasets, error) {
	ds := MulticenterDatasets{Id: id}
	existed, err := adapter.engine.Get(&ds)
	if err != nil {
		return nil, err
	}
	if existed {
		return &ds, nil
	}
	return nil, nil
}

// GetDataset supports either numeric id
func GetDataset(id int) (*MulticenterDatasets, error) {
    ds := &MulticenterDatasets{}
    ds.Id = id
    existed, err := adapter.engine.Get(ds)
    if err != nil {
        return nil, err
    }
    if existed {
        return ds, nil
    }
    return nil, nil
}

func GetDatasetBatch(ids []int) ([]*MulticenterDatasets, error) {
	datasets := []*MulticenterDatasets{}
	return datasets, adapter.engine.In("id", ids).Find(&datasets)
}

func AddDataset(ds *MulticenterDatasets) (bool, error) {
    // ensure date fields have default epoch if not provided
    ds.CreatedAt = time.Now().Format("2006-01-02 15:04:05")
	ds.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")
	if ds.ExpiredAt == "" {
		// 报错：ExpiredAt字段不能为空
		return false, errors.New("过期时间字段不能为空")
	}
	// 检查VisibleStatus是否合法
	if _, ok := datasetVisibleStatusMap[ds.VisibleStatus]; !ok {
		// 错误：VisibleStatus字段不合法
		return false, errors.New("可见性状态字段不合法")
	}

    affected, err := adapter.engine.Insert(ds)
    if err != nil {
        return false, err
    }
    return affected != 0, nil
}


func UpdateDataset(id int, owner string, ds *MulticenterDatasets) (bool, error) {
    old, err := GetDataset(id)
    if err != nil {
        return false, err
    }
    if old == nil {
        return false, nil
    }
	// 查询用户是否正确匹配
	if old.Owner != owner {
		return false, errors.New("您不是数据所有者，无法修改数据")
	}
	// 检查VisibleStatus是否合法
	if _, ok := datasetVisibleStatusMap[ds.VisibleStatus]; !ok {
		return false, errors.New("可见性状态字段不合法")
	}
	// Id、创建时间、数据拥有者、数据名称、到期日期不可修改
	ds.Id = old.Id
	ds.Owner = old.Owner
	ds.CreatedAt = old.CreatedAt
	ds.Unit = old.Unit
	ds.ExpiredAt = old.ExpiredAt
	ds.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")
    // use primary key update
    affected, err := adapter.engine.ID(core.PK{old.Id}).AllCols().Update(ds)
    if err != nil {
        return false, err
    }
    return affected != 0, nil
}

func DeleteDatasetById(id int) (bool, error) {
    affected, err := adapter.engine.ID(id).Delete(&MulticenterDatasets{})
    if err != nil {
        return false, err
    }
    return affected != 0, nil
}

func SearchDatasetMarket(username string, query string) ([]*MulticenterDatasets, error) {
	datasets := []*MulticenterDatasets{}
	publicStr := datasetVisibleStatusMap["PUBLIC"]
	// 我要找不是自己的数据集，且公开访问的
	if query == "" {
		err := adapter.engine.Where("owner != ? and visible_status = ?", username, publicStr).Find(&datasets)
		if err != nil {
			return datasets, err
		}
	} else {
		err := adapter.engine.Where("owner != ? and visible_status = ? and dataset_name like ?", username, publicStr, "%"+query+"%").Find(&datasets)
		if err != nil {
			return datasets, err
		}
	}
	return datasets, nil
}


// --- MulticenterDatasetsAccessrequests operations ---
func checkHasDuplicatedPendingAccessRequest(req *MulticenterDatasetsAccessrequests) (bool,[]int, error) {
	var accessReqs []MulticenterDatasetsAccessrequests
	err := adapter.engine.Where("reviewer = ? and asset_id = ? and requester = ? and request_status = ?", req.Reviewer, req.AssetId, req.Requester, accessReqStatusMap["PENDING"]).Find(&accessReqs)
	if err != nil {
		return false,nil, err
	}
	if len(accessReqs) > 0 {
		reqIds := []int{}
		for _, accessReq := range accessReqs {
			reqIds = append(reqIds, accessReq.RequestId)
		}
		return true, reqIds, nil
	}
	return false,nil, nil
}

func AddAccessRequest(req *MulticenterDatasetsAccessrequests) (bool, error) {
	// 找出assets，查看其可见性
	assets, err := GetDataset(req.AssetId)
	if err != nil {
		return false, err
	}
	if assets == nil {
		return false, errors.New("数据集不存在")
	}
	if assets.Owner == req.Requester {
		return false, errors.New("访问自己管理的数据集无需申请，请直接使用")
	}
	if assets.VisibleStatus != datasetVisibleStatusMap["PUBLIC"] {
		return false, errors.New("数据集非公开状态，无法申请访问")
	}
	// 检查时间是否在有效期内
	if req.RequestedDeadline > assets.ExpiredAt {
		return false, errors.New("申请时间超出数据集有效期")
	}
	

    // ensure date fields default to epoch if not provided
    req.RequestedAt = time.Now().Format("2006-01-02 15:04:05")
	req.RequestStatus = accessReqStatusMap["PENDING"]
	// asset_id 必须存在
	if req.AssetId == 0 {
        return false, errors.New("请选择要申请访问的数据集")
    }
	// 找出要申请的资产，将owner设置为reviewer
	asset, err := GetDataset(req.AssetId)
    if err != nil {
        return false, err
    }
	if asset == nil {
        return false, errors.New("数据集不存在")
    }
    req.Reviewer = asset.Owner

	if flag,duplicatedReqIds, _ := checkHasDuplicatedPendingAccessRequest(req); flag {
		if len(duplicatedReqIds) > 0 {
			// convert []int to []string for joining
			strIds := make([]string, 0, len(duplicatedReqIds))
			for _, id := range duplicatedReqIds {
				strIds = append(strIds, strconv.Itoa(id))
			}
			return false, errors.New("已存在相同的待审核申请（申请号: " + strings.Join(strIds, ",") + "），请先取消后再提交")
		}
		return false, errors.New("已存在相同的待审核申请，请先取消后再提交")
		
	}
	

    ensureDataDefault(&req.ReviewedAt)
    

    affected, err := adapter.engine.Insert(req)
    if err != nil {
        return false, err
    }
    return affected != 0, nil
}

func GetAccessRequestByReviewer(reviewer string) ([]*MulticenterDatasetsAccessrequests, error) {
	r := []*MulticenterDatasetsAccessrequests{}
	err := adapter.engine.Where("reviewer = ?", reviewer).Desc("requested_at").Find(&r)
	return r, err
}

func GetAccessRequestByReviewerAndStatus(reviewer string, status string) ([]*MulticenterDatasetsAccessrequests, error) {
	// 检查status是否合法，是否在accessReqStatusMap中
	if _, ok := accessReqStatusMap[status]; !ok {
		return nil, errors.New("status参数不合法")
	}
	r := []*MulticenterDatasetsAccessrequests{}
	err := adapter.engine.Where("reviewer = ? and request_status = ?", reviewer, status).Desc("requested_at").Find(&r)
	return r, err
}

func GetAccessRequestByRequester(requester string) ([]*MulticenterDatasetsAccessrequests, error) {
	r := []*MulticenterDatasetsAccessrequests{}
	err := adapter.engine.Where("requester = ?", requester).Desc("requested_at").Find(&r)
	return r, err
}

func GetAccessRequestByRequesterAndStatus(requester string, status string) ([]*MulticenterDatasetsAccessrequests, error) {
	// 检查status是否合法，是否在accessReqStatusMap中
	if _, ok := accessReqStatusMap[status]; !ok {
		return nil, errors.New("status参数不合法")
	}
	r := []*MulticenterDatasetsAccessrequests{}
	err := adapter.engine.Where("requester = ? and request_status = ?", requester, status).Desc("requested_at").Find(&r)
	return r, err
}

func GetAccessRequestById(id int) (*MulticenterDatasetsAccessrequests, error) {
	r := &MulticenterDatasetsAccessrequests{RequestId: id}
	existed, err := adapter.engine.Get(r)
	if err != nil {
		return nil, err
	}
	if existed {
		return r, nil
	}
	return nil, nil
}

func GetAccessRequestByIdAndUser(id int, username string) (*MulticenterDatasetsAccessrequests, error) {
    r := &MulticenterDatasetsAccessrequests{RequestId: id}
    existed, err := adapter.engine.Get(r)
    if err != nil {
        return nil, err
    }
    if existed {
		// 检查reviewer或requester是否匹配
		if r.Reviewer != username && r.Requester != username {
			return nil, fmt.Errorf("没有权限查看该申请工单")
		}
        return r, nil
    }
    return nil, nil
}

func CancelAccessRequest(id int, requester string) (bool, error) {
    req, err := GetAccessRequestById(id)
    if err != nil {
        return false, err
    }
    if req == nil {
        return false, nil
    }
	// 检查requester是否匹配
	if req.Requester != requester {
		return false, fmt.Errorf("申请工单请求者不匹配, 仅允许取消自己的请求")
	}

	// 检查状态是否允许取消
	if req.RequestStatus != accessReqStatusMap["PENDING"] {
		return false, fmt.Errorf("当前状态不允许取消")
	}
	
    req.RequestStatus = accessReqStatusMap["CANCELLED"]
    affected, err := adapter.engine.ID(req.RequestId).Update(req)
    if err != nil {
        return false, err
    }
    return affected != 0, nil
}

func PassOrRejectAccessRequest(id int, reviewer, comment string, approved bool) (bool, error) {
	status := accessReqStatusMap["REJECTED"]
	if approved {
		status = accessReqStatusMap["APPROVED"]
	}
    var req *MulticenterDatasetsAccessrequests
    var err error
	// 检查reviewer是否正确
	if reviewer != "" {
		// 进行相应的检查
		// 获取请求
    req, err = GetAccessRequestById(id)
		if err != nil {
			return false, err
		}
		if req == nil {
			return false, fmt.Errorf("access request not found")
		}
		// 检查是否允许审核
		if req.RequestStatus != accessReqStatusMap["PENDING"] {
			return false, fmt.Errorf("当前状态不允许审核")
		}
		if req.Reviewer != reviewer {
			return false, fmt.Errorf("您不是被分配的审核员")
		}
		
	}

	// 获取当前时间YYYY-MM-DD HH:mm:ss
	now := time.Now().Format("2006-01-02 15:04:05")


	affected, err := adapter.engine.Table(&MulticenterDatasetsAccessrequests{}).Where("request_id = ?", id).Update(map[string]interface{}{"request_status": status, "reviewer": reviewer, "review_comment": comment, "reviewed_at": now})
	if err != nil {
		return false, err
	}
	flag := affected > 0
	if flag {
		grantObj := MulticenterDatasetsAssetGrants{
			AssetId:    req.AssetId,
			RequestId:  id,
			GrantStatus: accessGrantStatusMap["GRANTED"],
			Owner:      req.Reviewer,
			Requester:  req.Requester,
			Deadline:   req.RequestedDeadline,
			AccessCount: req.RequestedAccessCount,
			
		}
    	_, _ = AddAssetGrant(&grantObj)
	}
	return flag, nil
}

// admin权限，不做校验，请勿使用
func UpdateAccessRequest(req *MulticenterDatasetsAccessrequests ) (bool, error) {
	if req.RequestId > 0 {
		affected, err := adapter.engine.ID(req.RequestId).AllCols().Update(req)
		if err != nil {
			return false, err
		}
		return affected != 0, nil
	}
	if req.RequestId <= 0 {
		return false, fmt.Errorf("invalid request id")
	}

	return false, nil
}

// 获取资产下的所有访问请求
func GetAccessRequestsByAsset(assetId int, username string) ([]*MulticenterDatasetsAccessrequests, error) {
    reqs := []*MulticenterDatasetsAccessrequests{}
    err := adapter.engine.Where("asset_id = ?", assetId).Desc("request_id").Find(&reqs)
    if err != nil {
        return reqs, err
    }
    // 过滤用户权限
    filtered := []*MulticenterDatasetsAccessrequests{}
    for _, req := range reqs {
        if req.Reviewer == username || req.Requester == username {
            filtered = append(filtered, req)
        }
    }
    return filtered, nil
}



// --- MulticenterDatasetsAssetGrants operations ---

func AddAssetGrant(g *MulticenterDatasetsAssetGrants) (bool, error) {
	duplicatedGrantCheckAndRevoke(g.AssetId, g.Requester,true)

    // ensure deadline default
    ensureDataDefault(&g.Deadline)


    affected, err := adapter.engine.Insert(g)
    if err != nil {
        return false, err
    }
    return affected != 0, nil
}

func RevokeAssetGrant(grantId int, owner string) (bool, error) {
	// 1. 先确定资产授权是否存在
	grant, err := GetAssetGrantById(grantId)
	if err != nil {
		return false, err
	}
	if grant == nil {
		return false, fmt.Errorf("授权不存在")
	}
	if grant.Owner != owner {
		return false, fmt.Errorf("没有权限")
	}
	// 将授权状态更改为REVOKED
	affected, err := adapter.engine.ID(grantId).Update(&MulticenterDatasetsAssetGrants{
		GrantStatus: accessGrantStatusMap["REVOKED"],
	})
    if err != nil {
        return false, err
    }
    return affected != 0, nil
}

// 用于到期后删除授权（auto）
func revokeGrantAuto(grant_id int)(bool, error){
	var grant *MulticenterDatasetsAssetGrants
	// 1. 先确定资产授权是否存在
	grant, err := GetAssetGrantById(grant_id)
	if err != nil {
		return false, err
	}
	if grant == nil {
		return false, fmt.Errorf("授权不存在")
	}
	// 3. 撤销授权
	affected, err := adapter.engine.ID(grant_id).Update(&MulticenterDatasetsAssetGrants{
		GrantStatus: accessGrantStatusMap["REVOKED"],
	})
	if err != nil {
		return false, err
	}
	return affected != 0, nil
}

func GetAssetGrantById(grant_id int) (*MulticenterDatasetsAssetGrants, error) {
    grant := MulticenterDatasetsAssetGrants{}
    existed, err := adapter.engine.ID(grant_id).Get(&grant)
    if err != nil {
        return nil, err
    }
    if existed {
        return &grant, nil
    }
    return nil, nil
}

func GetAssetGrantByIdAndUser(grant_id int, username string) (*MulticenterDatasetsAndAssetGrants_TOGETHER, error) {
	grant := MulticenterDatasetsAssetGrants{}
	grantAndDataset := MulticenterDatasetsAndAssetGrants_TOGETHER{}
	existed, err := adapter.engine.Where("grant_id = ?", grant_id).Get(&grant)
	if err != nil {
		return nil, err
	}
	if existed {
		// 检查owner或requester是否匹配
		if grant.Owner != username && grant.Requester != username {
			return nil, fmt.Errorf("没有权限查看该授权信息")
		}
		// 同时查询dataset信息
		dataset, err := GetDataset(grant.AssetId)
		if err != nil {
			return nil, err
		}
		grantAndDataset.Dataset = *dataset
		grantAndDataset.AccessGrant = grant
	
		return &grantAndDataset, nil
	}
	return nil, nil
}

func GetGrantsByAsset(assetId int) ([]*MulticenterDatasetsAssetGrants, error) {
    grants := []*MulticenterDatasetsAssetGrants{}
    err := adapter.engine.Where("asset_id = ?", assetId).Desc("grant_id").Find(&grants)
    if err != nil {
        return grants, err
    }
    return grants, nil
}

func GetGrantsByAssetAndOwner(assetId int, owner string) ([]*MulticenterDatasetsAndAssetGrants_TOGETHER, error) {
	grants := []*MulticenterDatasetsAssetGrants{}
	grantsAndDataset := []*MulticenterDatasetsAndAssetGrants_TOGETHER{}
	err := adapter.engine.Where("asset_id = ? and owner = ?", assetId, owner).Desc("grant_id").Find(&grants)
	if err != nil {
		return grantsAndDataset, err
	}
	// 查询对应的dataset信息, 使用GetDatasetBatch
	datasetIds := []int{}
	for _, grant := range grants {
		datasetIds = append(datasetIds, grant.AssetId)
	}
	datasetMap := map[int]*MulticenterDatasets{}
	datasets, err := GetDatasetBatch(datasetIds)
	if err != nil {
		return nil, err
	}
	for _, dataset := range datasets {
		datasetMap[dataset.Id] = dataset
	}
	for _, grant := range grants {
		grantAndDataset := MulticenterDatasetsAndAssetGrants_TOGETHER{}
		grantAndDataset.AccessGrant = *grant

		if dataset, ok := datasetMap[grant.AssetId]; ok {
			grantAndDataset.Dataset = *dataset
		}
		grantsAndDataset = append(grantsAndDataset, &grantAndDataset)
	}
	return grantsAndDataset, nil
}

func GetGrantsByRequest(requestId int, username string) ([]*MulticenterDatasetsAndAssetGrants_TOGETHER, error) {
    grants := []*MulticenterDatasetsAssetGrants{}
	grantsAndDataset := []*MulticenterDatasetsAndAssetGrants_TOGETHER{}
    err := adapter.engine.Where("request_id = ?", requestId).Desc("grant_id").Find(&grants)
	
    if err != nil {
        return nil, err
    }
    // 过滤用户权限
    filtered := []*MulticenterDatasetsAssetGrants{}
    for _, grant := range grants {
        if grant.Owner == username || grant.Requester == username {
            filtered = append(filtered, grant)
        }
    }
	// 查询对应的dataset信息, 使用GetDatasetBatch
	datasetIds := []int{}
	for _, grant := range filtered {
		datasetIds = append(datasetIds, grant.AssetId)
	}
	datasetMap := map[int]*MulticenterDatasets{}
	datasets, err := GetDatasetBatch(datasetIds)
	if err != nil {
		return nil, err
	}
	for _, dataset := range datasets {
		datasetMap[dataset.Id] = dataset
	}
	for _, grant := range filtered {
		grantAndDataset := MulticenterDatasetsAndAssetGrants_TOGETHER{}
		grantAndDataset.AccessGrant = *grant

		if dataset, ok := datasetMap[grant.AssetId]; ok {
			grantAndDataset.Dataset = *dataset
		}
		grantsAndDataset = append(grantsAndDataset, &grantAndDataset)
	}

    return grantsAndDataset, nil
}


func GetGrantsByOwner(owner string) ([]*MulticenterDatasetsAndAssetGrants_TOGETHER, error) {
    grants := []*MulticenterDatasetsAssetGrants{}
	grantsAndDataset := []*MulticenterDatasetsAndAssetGrants_TOGETHER{}
    err := adapter.engine.Where("owner = ?", owner).Desc("grant_id").Find(&grants)
    if err != nil {
        return grantsAndDataset, err
    }
    // 查询对应的dataset信息, 使用GetDatasetBatch
    datasetIds := []int{}
    for _, grant := range grants {
        datasetIds = append(datasetIds, grant.AssetId)
    }
    datasetMap := map[int]*MulticenterDatasets{}
    datasets, err := GetDatasetBatch(datasetIds)
    if err != nil {
        return nil, err
    }
    for _, dataset := range datasets {
        datasetMap[dataset.Id] = dataset
    }
    for _, grant := range grants {
        grantAndDataset := MulticenterDatasetsAndAssetGrants_TOGETHER{}
		grantAndDataset.AccessGrant = *grant

		if dataset, ok := datasetMap[grant.AssetId]; ok {
			grantAndDataset.Dataset = *dataset
		}
        grantsAndDataset = append(grantsAndDataset, &grantAndDataset)
    }
    return grantsAndDataset, nil
}

func GetGrantsByRequester(requester string) ([]*MulticenterDatasetsAndAssetGrants_TOGETHER, error) {
    grants := []*MulticenterDatasetsAssetGrants{}
	grantsAndDataset := []*MulticenterDatasetsAndAssetGrants_TOGETHER{}
    err := adapter.engine.Where("requester = ?", requester).Desc("grant_id").Find(&grants)
    if err != nil {
        return grantsAndDataset, err
    }
    // 查询对应的dataset信息, 使用GetDatasetBatch
    datasetIds := []int{}
    for _, grant := range grants {
        datasetIds = append(datasetIds, grant.AssetId)
    }
    datasetMap := map[int]*MulticenterDatasets{}
    datasets, err := GetDatasetBatch(datasetIds)
    if err != nil {
        return nil, err
    }
    for _, dataset := range datasets {
        datasetMap[dataset.Id] = dataset
    }
    for _, grant := range grants {
        grantAndDataset := MulticenterDatasetsAndAssetGrants_TOGETHER{}
		grantAndDataset.AccessGrant = *grant

		if dataset, ok := datasetMap[grant.AssetId]; ok {
			grantAndDataset.Dataset = *dataset
		}
        grantsAndDataset = append(grantsAndDataset, &grantAndDataset)
    }
    return grantsAndDataset, nil
}

func GetGrantedAssetsByRequester(requester string) ([]*MulticenterDatasetsAndAssetGrants_TOGETHER, error) {

	grants := []*MulticenterDatasetsAssetGrants{}
	grantsAndDataset := []*MulticenterDatasetsAndAssetGrants_TOGETHER{}
	grantedstr := accessGrantStatusMap["GRANTED"]
	err := adapter.engine.Where("requester = ? and grant_status = ?", requester, grantedstr).Desc("grant_id").Find(&grants)
	if err != nil {
		return nil, err
	}
	// 查询对应的dataset信息, 使用GetDatasetBatch
	datasetIds := []int{}
	for _, grant := range grants {
		datasetIds = append(datasetIds, grant.AssetId)
	}
	datasetMap := map[int]*MulticenterDatasets{}
	datasets, err := GetDatasetBatch(datasetIds)
	if err != nil {
		return nil, err
	}
	for _, dataset := range datasets {
		datasetMap[dataset.Id] = dataset
	}
	for _, grant := range grants {
		grantAndDataset := MulticenterDatasetsAndAssetGrants_TOGETHER{}
		grantAndDataset.AccessGrant = *grant
		if dataset, ok := datasetMap[grant.AssetId]; ok {
			grantAndDataset.Dataset = *dataset
		}
		grantsAndDataset = append(grantsAndDataset, &grantAndDataset)
	}
	return grantsAndDataset, nil
}



func GetGrantedAssetsByOwner(owner string) ([]*MulticenterDatasetsAndAssetGrants_TOGETHER, error) { 
	grants := []*MulticenterDatasetsAssetGrants{}
	grantsAndDataset := []*MulticenterDatasetsAndAssetGrants_TOGETHER{}
	grantedstr := accessGrantStatusMap["GRANTED"]
	err := adapter.engine.Where("owner = ? and grant_status = ?", owner, grantedstr).Desc("grant_id").Find(&grants)
	if err != nil {
		return nil, err
	}


	// 查询对应的dataset信息, 使用GetDatasetBatch
	datasetIds := []int{}
	for _, grant := range grants {
		datasetIds = append(datasetIds, grant.AssetId)
	}
	datasetMap := map[int]*MulticenterDatasets{}
	datasets, err := GetDatasetBatch(datasetIds)
	if err != nil {
		return nil, err
	}
	for _, dataset := range datasets {
		datasetMap[dataset.Id] = dataset
	}
	for _, grant := range grants {
		grantAndDataset := MulticenterDatasetsAndAssetGrants_TOGETHER{}
		grantAndDataset.AccessGrant = *grant
		if dataset, ok := datasetMap[grant.AssetId]; ok {
			grantAndDataset.Dataset = *dataset
		}
		grantsAndDataset = append(grantsAndDataset, &grantAndDataset)
	}
	return grantsAndDataset, nil
}

func duplicatedGrantCheckAndRevoke(asset_id int, requester string,revoke bool) (bool, error) {
	// 查询是否存在相同的授权记录，且状态为GRANTED
	grantedstr := accessGrantStatusMap["GRANTED"]
	existed, err := adapter.engine.Where("asset_id = ? and requester = ? and grant_status = ?", asset_id, requester, grantedstr).Exist(&MulticenterDatasetsAssetGrants{})


	if err != nil {
		return false, err
	}

	if existed && revoke {
		// 撤销已有的授权
		_, err := adapter.engine.Table(&MulticenterDatasetsAssetGrants{}).Where("asset_id = ? and requester = ? and grant_status = ?", asset_id, requester, grantedstr).Update(map[string]interface{}{"grant_status": accessGrantStatusMap["REVOKED"]})
		if err != nil {
			return false, err
		}
	}
	return existed, nil
}


func CheckUsage(grantID int) (string,int, error) {
	// 先去数据库找一下存不存在
	grant, err := GetAssetGrantById(grantID)
	if err != nil {
		return "", 0, err
	}
	if grant == nil {
		return "", 0, fmt.Errorf("授权不存在")
	}



	// curl -X GET "http://10.129.2.46:13900/api/check-usage?usageID="
	usageIDStr := fmt.Sprintf("%d", grantID)
	urlPrefix,_ := GET_DYNAMIC_CONFIG_VALUE_BY_KEY("multiCenter.data-usage.url", "http://10.129.2.46:13900/api")
	usageIDPrefixStr,_ := GET_DYNAMIC_CONFIG_VALUE_BY_KEY("multiCenter.data-usage.prefix", "med-casibase")
	url := fmt.Sprintf("%s/check-usage?usageID=%s", urlPrefix, (usageIDPrefixStr+usageIDStr))
	// 发起HTTP请求，使用http框架，get
	resp, err := http.Get(url)
	if err != nil {
		return "",0, fmt.Errorf("数据受控服务出现异常：failed to call usage service: %v", err)		
	}
	defer resp.Body.Close()
	// 读取返回结果
	respBody, err := ioutil.ReadAll(resp.Body)

	
	// 解析返回结果
	resultMap := map[string]interface{}{}
	err = json.Unmarshal(respBody, &resultMap)
		/**
		{
	"status": "ok",
	"msg": "",
	"data": {
		"UsageID": "usage-api-001",
		"DatasetID": "my-new-dataset-001",
		"User": "43794e0cc70099bc95d8af672d24eb35d14ddcd9",
		"ExpireTime": "2026-11-30 23:59:59",
		"UseCountLeft": 95
	},
	"data2": null
	}*/
	if err != nil {
		return "", 0, err
	}

	if status, ok := resultMap["status"].(string); ok {
		if status != "ok" {
			msg := ""
			if m, ok := resultMap["msg"].(string); ok {
				msg = m
			}
			return "", 0, fmt.Errorf("数据受控服务出现异常：usage service returned error: %s", msg)
		}
	} else {
		return "", 0, fmt.Errorf("数据受控服务出现异常：invalid response from usage service")
	}

	data, ok := resultMap["data"].(map[string]interface{})
	if !ok {
		return "", 0, fmt.Errorf("数据受控服务出现异常：invalid data format from usage service")
	}

	expireTime, ok := data["ExpireTime"].(string)
	if !ok {
		return "", 0, fmt.Errorf("数据受控服务出现异常：	invalid ExpireTime format from usage service")
	}

	useCountLeft, ok := data["UseCountLeft"].(int)
	if !ok {
		return "", 0, fmt.Errorf("数据受控服务出现异常：invalid UseCountLeft format from usage service")
	}

	return expireTime, useCountLeft, nil

}

func CheckAndUse(grantID int,user string) (bool, error) {
	// 先去数据库找一下存不存在
	grant, err := GetAssetGrantById(grantID)
	if err != nil {
		return false, err
	}
	if grant == nil {
		return false, fmt.Errorf("授权不存在")
	}
	if grant.Requester != user {
		return false, fmt.Errorf("没有权限使用该授权")
	}
	
	urlPrefix,_ := GET_DYNAMIC_CONFIG_VALUE_BY_KEY("multiCenter.data-usage.url", "http://10.129.2.46:13900/api")
	usageIDPrefixStr,_ := GET_DYNAMIC_CONFIG_VALUE_BY_KEY("multiCenter.data-usage.prefix", "med-casibase")
	usageIDStr := fmt.Sprintf("%d", grantID)
	url := fmt.Sprintf("%s/check-and-use", urlPrefix)
	// 1. 创建缓冲区存储multipart/form-data内容
	var requestBody bytes.Buffer
	// 2. 创建multipart writer绑定缓冲区
	writer := multipart.NewWriter(&requestBody)
	
	// 3. 向表单添加字段（所有值均为字符串，直接写入）
	// UsageID字段（拼接前缀）
	usageID := usageIDPrefixStr + usageIDStr
	if err := writer.WriteField("usageID", usageID); err != nil {
		return false, fmt.Errorf("添加UsageID字段失败: %v", err)
	}
	// datasetID字段
	datasetID := fmt.Sprintf("%s_DATASET_%d", usageIDPrefixStr, grant.AssetId)
	if err := writer.WriteField("datasetID", datasetID); err != nil {
		return false, fmt.Errorf("添加DatasetID字段失败: %v", err)
	}

	// userCert字段
	if err := writer.WriteField("userCert", grant.Requester); err != nil {
		return false, fmt.Errorf("添加UserCert字段失败: %v", err)
	}
	// 4. 关闭writer，生成multipart格式的结束边界
	if err := writer.Close(); err != nil {
		return false, fmt.Errorf("关闭multipart writer失败: %v", err)
	}

	// 5. 创建POST请求
	req, err := http.NewRequest("POST", url, &requestBody)
	if err != nil {
		return false, fmt.Errorf("创建请求失败: %v", err)
	}

	// 6. 设置Content-Type（包含multipart的边界标识，由writer生成）
	req.Header.Set("Content-Type", writer.FormDataContentType())

	// 7. 发送请求
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return false, fmt.Errorf("发送请求失败: %v", err)
	}
	defer resp.Body.Close()

	// 8. 解析响应（和原逻辑一致）
	var data map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return false, fmt.Errorf("解析响应失败: %v", err)
	}

	/**
	{
  "status": "ok",
  "msg": "",
  "data": "数据集使用成功",
  "data2": null
  }
  */
	// 检查响应状态
	return data["status"] == "ok", nil
}


func createUsageInChain(usageId string, datasetId string, expireTime string, user string, useCountLeft int) (bool, error) {
	// 向/new-strategy接口发送POST请求
	urlPrefix,_ := GET_DYNAMIC_CONFIG_VALUE_BY_KEY("multiCenter.data-usage.url", "http://10.129.2.46:13900/api")
	usageIDPrefixStr,_ := GET_DYNAMIC_CONFIG_VALUE_BY_KEY("multiCenter.data-usage.prefix", "med-casibase")


		url := fmt.Sprintf("%s/new-strategy", urlPrefix)

	// 1. 创建缓冲区存储multipart/form-data内容
	var requestBody bytes.Buffer
	// 2. 创建multipart writer，绑定缓冲区
	writer := multipart.NewWriter(&requestBody)

	// 3. 向表单中添加字段（注意：所有值需转换为字符串）
	// OperationType字段
	if err := writer.WriteField("operationType", "createDatasetUsage"); err != nil {
		return false, fmt.Errorf("添加OperationType字段失败: %v", err)
	}
	// UsageID字段（拼接前缀）
	usageID := usageIDPrefixStr + usageId
	if err := writer.WriteField("usageID", usageID); err != nil {
		return false, fmt.Errorf("添加UsageID字段失败: %v", err)
	}
	// DatasetID字段
	if err := writer.WriteField("datasetID", datasetId); err != nil {
		return false, fmt.Errorf("添加DatasetID字段失败: %v", err)
	}
	// ExpireTime字段
	if err := writer.WriteField("expireTime", expireTime); err != nil {
		return false, fmt.Errorf("添加ExpireTime字段失败: %v", err)
	}
	// User字段
	if err := writer.WriteField("user", user); err != nil {
		return false, fmt.Errorf("添加User字段失败: %v", err)
	}
	// UseCountLeft字段（int转string）
	if err := writer.WriteField("useCountLeft", strconv.Itoa(useCountLeft)); err != nil {
		return false, fmt.Errorf("添加UseCountLeft字段失败: %v", err)
	}

	// 4. 关闭writer，生成multipart/form-data的结束边界
	if err := writer.Close(); err != nil {
		return false, fmt.Errorf("关闭multipart writer失败: %v", err)
	}

	// 5. 创建POST请求
	req, err := http.NewRequest("POST", url, &requestBody)
	if err != nil {
		return false, fmt.Errorf("创建请求失败: %v", err)
	}

	// 6. 设置Content-Type（包含multipart的边界标识，由writer生成）
	req.Header.Set("Content-Type", writer.FormDataContentType())

	// 7. 发送请求
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return false, fmt.Errorf("发送请求失败: %v", err)
	}
	defer resp.Body.Close()

	// 8. 解析响应（和原逻辑一致）
	var data map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return false, fmt.Errorf("解析响应失败: %v", err)
	}

	// 检查响应状态
	return data["status"] == "ok", nil
}


func createDatasetInChain(datasetId string, owner string, description string, expiredAt string) (bool, error) {
	urlPrefix,_ := GET_DYNAMIC_CONFIG_VALUE_BY_KEY("multiCenter.data-usage.url", "http://10.129.2.46:13900/api")
	usageIDPrefixStr,_ := GET_DYNAMIC_CONFIG_VALUE_BY_KEY("multiCenter.data-usage.prefix", "med-casibase")

	url := fmt.Sprintf("%s/new-strategy", urlPrefix)

	// 1. 创建缓冲区存储multipart/form-data内容
	var requestBody bytes.Buffer
	// 2. 创建multipart writer绑定缓冲区
	writer := multipart.NewWriter(&requestBody)

	// 3. 向表单添加字段（所有值均为字符串，直接写入）
	// OperationType字段
	if err := writer.WriteField("operationType", "createDataset"); err != nil {
		return false, fmt.Errorf("添加OperationType字段失败: %v", err)
	}
	// DatasetID字段（拼接前缀）
	fullDatasetID := usageIDPrefixStr + "_DATASET_" + datasetId
	if err := writer.WriteField("datasetID", fullDatasetID); err != nil {
		return false, fmt.Errorf("添加DatasetID字段失败: %v", err)
	}
	// Owner字段
	if err := writer.WriteField("owner", owner); err != nil {
		return false, fmt.Errorf("添加Owner字段失败: %v", err)
	}
	// Description字段
	if err := writer.WriteField("description", description); err != nil {
		return false, fmt.Errorf("添加Description字段失败: %v", err)
	}
	// ExpireTime字段（对应参数expiredAt）
	if err := writer.WriteField("expireTime", expiredAt); err != nil {
		return false, fmt.Errorf("添加ExpireTime字段失败: %v", err)
	}

	// 文件字段，从本地读取一个空文件作为占位符
	fileWriter, err := writer.CreateFormFile("dataFile", "placeholder.txt")
	if err != nil {
		return false, fmt.Errorf("创建文件字段失败: %v", err)
	}
	placeholderContent := []byte("This is a placeholder file.")
	if _, err := fileWriter.Write(placeholderContent); err != nil {
		return false, fmt.Errorf("写入文件内容失败: %v", err)
	}
	if err := writer.Close(); err != nil {
		return false, fmt.Errorf("关闭writer失败: %v", err)
	}



	// 4. 关闭writer，生成multipart格式的结束边界
	if err := writer.Close(); err != nil {
		return false, fmt.Errorf("关闭multipart writer失败: %v", err)
	}

	// 5. 创建POST请求
	req, err := http.NewRequest("POST", url, &requestBody)
	if err != nil {
		return false, fmt.Errorf("创建请求失败: %v", err)
	}

	// 6. 设置Content-Type（包含自动生成的边界标识）
	req.Header.Set("Content-Type", writer.FormDataContentType())

	// 7. 发送请求
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return false, fmt.Errorf("发送请求失败: %v", err)
	}
	defer resp.Body.Close()

	// 8. 解析响应（与原逻辑一致）
	var data map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return false, fmt.Errorf("解析响应失败: %v", err)
	}

	return data["status"] == "ok", nil
}

// --- records ---
func AddMultiCenterDatasetRecordByIds(recordIds []int) (int, error) {
	records := []*Record{}
	// Object是一个json字符串，需要转换，提取其中的diagnosis字段，以;分隔（有几个;就添加几个keyword字段）

	// 查询数据库，获取recordIds对应的Record对象
	records, err := GetRecordsByIds(recordIds)
	if err != nil {
		return 0, err
	}
	return AddMultiCenterDatasetRecord(records)

}

func AddMultiCenterDatasetRecord(records []*Record) (int, error) {
	var multiCenterRecords []MulticenterDatasetsRecords
	for _, record := range records {
		if record == nil {
			continue
		}
		var diagnosis string
		if err := json.Unmarshal([]byte(record.Object), &diagnosis); err != nil {
			// 跳过该条记录，继续处理下一个
			continue
		}
		// 如果record的Id、Unit、Object任意为空，则跳过该条记录
		if record.Unit == "" || record.Object == "" {
			continue
		}
		keywords := strings.Split(diagnosis, ";")
		// 去除空字符串
		filteredKeywords := []string{}
		for _, kw := range keywords {
			trimmed := strings.TrimSpace(kw)
			if trimmed != "" {
				filteredKeywords = append(filteredKeywords, trimmed)
			}
		}
		keywords = filteredKeywords	
		for _, keyword := range keywords {
			multiCenterRecord := MulticenterDatasetsRecords{
				Keyword:  keyword,
				Object:   record.Object,
				RecordId: record.Id,
				Unit:     record.Unit,
			}
			multiCenterRecords = append(multiCenterRecords, multiCenterRecord)
		}
	}
	// multiCenterRecords存入数据库
	affected, err := adapter.engine.Insert(&multiCenterRecords)
	if err != nil {
		return 0, fmt.Errorf("存入数据库失败: %v", err)
	}
	return int(affected), nil
}

func GetMultiCenterDatasetsRecordsByKeywordAndUnit(keyword string, unit string) ([]MulticenterDatasetsRecords, error) {
	var records []MulticenterDatasetsRecords
	err := adapter.engine.Where("unit = ? AND keyword like ?", unit, "%"+keyword+"%").Find(&records).Error
	if err != nil {
		return nil, fmt.Errorf("查询数据库失败: %v", err)
	}
	return records, nil
}