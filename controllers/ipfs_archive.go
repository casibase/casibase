// Copyright 2023 The Casibase Authors. All Rights Reserved.
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
	"fmt"
	"strconv"
	"strings"

	"github.com/beego/beego/utils/pagination"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

// GetIpfsArchives
// @Title GetIpfsArchives
// @Tag IpfsArchive API
// @Description get all ipfs archives
// @Param   pageSize     query    string  true        "The size of each page"
// @Param   p     query    string  true        "The number of the page"
// @Param   field     query    string  false        "The field to search"
// @Param   value     query    string  false        "The value to search"
// @Param   sortField     query    string  false        "The field to sort"
// @Param   sortOrder     query    string  false        "The order to sort"
// @Success 200 {object// RemoveRecordFromQueueByRecordIdAndDataType
// object.IpfsArchive The Response object
// @router /get-ipfs-archives [get]
func (c *ApiController) GetIpfsArchives() {
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	if limit == "" || page == "" {
		archives, err := object.GetIpfsArchives(0, 0, field, value, sortField, sortOrder)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(archives)
	} else {
		limit, err := util.ParseIntWithError(limit)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		// pageNum, err := util.ParseIntWithError(page)
		// if err != nil {
		// 	c.ResponseError(err.Error())
		// 	return
		// }

		// Temporarily get all archives for pagination (to be replaced with proper count function)
		allArchives, err := object.GetIpfsArchives(0, 0, field, value, sortField, sortOrder)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		count := len(allArchives)

		paginator := pagination.SetPaginator(c.Ctx, limit, int64(count))
		archives, err := object.GetIpfsArchives(paginator.Offset(), limit, field, value, sortField, sortOrder)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(archives, paginator.Nums())
	}
}

// GetAllQueueData
// @Title GetAllQueueData
// @Tag IpfsArchive API
// @Description get all queue data
// @Success 200 object map[int][]*object.Record The Response object
// @router /get-ipfs-archive-all-queue-data [get]
func (c *ApiController) GetAllQueueData() {
	// 获取所有队列数据
	queueData := object.GetAllQueueData()

	c.ResponseOk(queueData)
}

// GetIpfsArchiveByCorrelationId
// @Title GetIpfsArchive
// @Tag IpfsArchive API
// @Description get ipfs archive
// @Param   correlation_id     query    string  true        "The correlation_id of the ipfs archive"
// @Success 200 {object} object.IpfsArchive The Response object
// @router /get-ipfs-archive-by-correlation-id [get]
func (c *ApiController) GetIpfsArchiveByCorrelationId() {
	correlationId := c.Input().Get("correlation_id")

	archive, err := object.GetIpfsArchiveByCorrelationId(correlationId)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(archive)
}

// GetIpfsArchivesByCorrelationIdAndDataType
// @Title GetIpfsArchivesByCorrelationIdAndDataType
// @Tag IpfsArchive API
// @Description get ipfs archives by correlation_id and data_type
// @Param   correlation_id     query    string  true        "The correlation_id of the ipfs archive"
// @Param   data_type     query    int  true        "The data_type of the ipfs archive"
// @Param   pageSize     query    string  false        "The size of each page"
// @Param   p     query    string  false        "The number of the page"
// @Success 200 {object} []object.IpfsArchive The Response object
// @router /get-ipfs-archives-by-correlation-id-and-data-type [get]
func (c *ApiController) GetIpfsArchivesByCorrelationIdAndDataType() {
	correlationId := c.Input().Get("correlationId")
	dataTypeStr := c.Input().Get("dataType")
	pageSize := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	dataType, err := util.ParseIntWithError(dataTypeStr)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	var limit, offset int
	if pageSize != "" && page != "" {
		limit, err = util.ParseIntWithError(pageSize)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		pageNum, err := util.ParseIntWithError(page)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		offset = (pageNum - 1) * limit
	} else {
		// Default to get all records if no pagination is specified
		offset = 0
		limit = 0
	}

	archives, err := object.GetIpfsArchivesByCorrelationIdAndDataType(correlationId, dataType, offset, limit, sortField, sortOrder)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(archives)
}

// GetIpfsArchiveById
// @Title GetIpfsArchiveById
// @Tag IpfsArchive API
// @Description get ipfs archive by id
// @Param   id     query    int  true        "The id of the ipfs archive"
// @Success 200 {object} object.IpfsArchive The Response object
// @router /get-ipfs-archive-by-id [get]
func (c *ApiController) GetIpfsArchiveById() {
	idStr := c.Input().Get("id")
	idInt, err := util.ParseIntWithError(idStr)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	archive, err := object.GetIpfsArchiveById(int64(idInt))
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(archive)
}

// AddIpfsArchive
// @Title AddIpfsArchive
// @Tag IpfsArchive API
// @Description add a ipfs archive
// @Param   body    body   object.IpfsArchive  true        "The details of the ipfs archive"
// @Success 200 {object} controllers.Response The Response object
// @router /add-ipfs-archive [post]
func (c *ApiController) AddIpfsArchive() {
	var archive object.IpfsArchive
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &archive)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.AddIpfsArchive(&archive))
	c.ServeJSON()
}

// UpdateIpfsArchive
// @Title UpdateIpfsArchive
// @Tag IpfsArchive API
// @Description update ipfs archive
// @Param   id     query    int  true        "The id of the ipfs archive"
// @Param   body    body   object.IpfsArchive  true        "The details of the ipfs archive"
// @Success 200 {object} controllers.Response The Response object
// @router /update-ipfs-archive [post]
func (c *ApiController) UpdateIpfsArchive() {
	idStr := c.Input().Get("id")
	idInt, err := util.ParseIntWithError(idStr)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	var archive object.IpfsArchive
	err = json.Unmarshal(c.Ctx.Input.RequestBody, &archive)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// 确保id匹配
	archive.Id = int64(idInt)

	c.Data["json"] = wrapActionResponse(object.UpdateIpfsArchive(&archive))
	c.ServeJSON()
}

// DeleteIpfsArchive
// @Title DeleteIpfsArchive
// @Tag IpfsArchive API
// @Description delete a ipfs archive
// @Param   body    body   object.IpfsArchive  true        "The details of the ipfs archive"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-ipfs-archive-by-id [post]
func (c *ApiController) DeleteIpfsArchiveById() {
	var archive object.IpfsArchive
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &archive)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.DeleteIpfsArchiveById(archive.Id))
	c.ServeJSON()
}

// AddUnUploadIpfsDataToQueue
// @Title AddUnUploadIpfsDataToQueue
// @Tag IpfsArchive API
// @Description add unuploaded ipfs data to queue
// @Success 200 {object} controllers.Response The Response object
// @router /api/add-ipfs-archive-unupload-queue-data [get]
func (c *ApiController) AddUnUploadIpfsDataToQueue() {
	err := object.AddUnUploadIpfsDataToQueue()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk("Successfully added unuploaded ipfs data to queue")
}

// AddRecordsWithDataTypesToQueue
// @Title AddRecordsWithDataTypesToQueue
// @Tag IpfsArchive API
// @Description add records with data types to queue
// @Param   body    body   []struct{RecordId int64; DataType int}  true        "The records with data types"
// @Success 200 {object} controllers.Response The Response object
// @router /api/add-ipfs-archive-queue-data-by-record-id [post]
func (c *ApiController) AddRecordsWithDataTypesToQueue() {
	// 获取recordIds和dataTypes参数
	recordIdsStr := c.GetString("recordIds")
	dataTypesStr := c.GetString("dataTypes")

	// 解析recordIds字符串为int64数组
	recordIdsStrs := strings.Split(recordIdsStr, ",")

	recordIds := make([]int64, 0, len(recordIdsStrs))
	for _, idStr := range recordIdsStrs {
		id, err := strconv.ParseInt(strings.TrimSpace(idStr), 10, 64)
		if err != nil {
			c.ResponseError(fmt.Sprintf("Invalid recordId: %s", idStr))
			return
		}
		recordIds = append(recordIds, id)
	}

	// 解析dataTypes字符串为int数组
	dataTypesStrs := strings.Split(dataTypesStr, ",")
	dataTypes := make([]int, 0, len(dataTypesStrs))
	for _, typeStr := range dataTypesStrs {
		typ, err := strconv.Atoi(strings.TrimSpace(typeStr))
		if err != nil {
			c.ResponseError(fmt.Sprintf("Invalid dataType: %s", typeStr))
			return
		}
		dataTypes = append(dataTypes, typ)
	}

	// 验证两个数组长度是否一致
	if len(recordIds) != len(dataTypes) {
		c.ResponseError("The number of recordIds and dataTypes must be the same")
		return
	}

	// 创建记录数组
	records := make([]struct {
		RecordId int64
		DataType int
	}, len(recordIds))
	for i := range recordIds {
		records[i] = struct {
			RecordId int64
			DataType int
		}{
			RecordId: recordIds[i],
			DataType: dataTypes[i],
		}
	}

	err := object.AddRecordsWithDataTypesToQueue(records)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk("Successfully added records to queue")
}

// @Title RemoveRecordFromQueueByRecordIdAndDataType
// @Tag IpfsArchive API
// @Description remove a record from queue by recordId and dataType
// @Param   recordId     query    int64  true        "The recordId of the record to remove"
// @Param   dataType     query    int  true        "The dataType of the record to remove"
// @Success 200 {object} controllers.Response The Response object
// @router /api/remove-ipfs-archive-queue-data-by-record-id-and-data-type [post]
func (c *ApiController) RemoveRecordFromQueueByRecordIdAndDataType() {
	// 获取recordId和dataType参数
	recordIdStr := c.Input().Get("recordId")
	dataTypeStr := c.Input().Get("dataType")

	// 解析recordId字符串为int64
	recordId, err := strconv.ParseInt(strings.TrimSpace(recordIdStr), 10, 64)
	if err != nil {
		c.ResponseError(fmt.Sprintf("Invalid recordId: %s", recordIdStr))
		return
	}

	// 解析dataType字符串为int
	dataType, err := strconv.Atoi(strings.TrimSpace(dataTypeStr))
	if err != nil {
		c.ResponseError(fmt.Sprintf("Invalid dataType: %s", dataTypeStr))
		return
	}

	// 调用object包中的函数移除记录
	err = object.RemoveRecordFromQueueByRecordIdAndDataType(recordId, dataType)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk("Successfully removed record from queue")
}

// ArchiveToIPFS
// @Title ArchiveToIPFS
// @Tag IpfsArchive API
// @Description manually trigger IPFS archiving for a specific data type
// @Param   dataType     query    int  true        "The data type to archive"
// @Success 200 {object} controllers.Response The Response object
// @router /api/archive-to-ipfs [post]
func (c *ApiController) ArchiveToIPFS() {
	// 获取dataType参数
	dataTypeStr := c.Input().Get("dataType")
	userId, flag := c.CheckSignedIn()
	if flag == false {
		c.ResponseError("User not signed in")
		return
	}

	// 解析dataType字符串为int
	dataType, err := strconv.Atoi(strings.TrimSpace(dataTypeStr))
	if err != nil {
		c.ResponseError(fmt.Sprintf("Invalid dataType: %s", dataTypeStr))
		return
	}

	// 调用object包中的函数执行归档
	go object.ArchiveToIPFS(dataType, userId)

	c.ResponseOk("IPFS archiving process has been triggered")
}
