package controllers

import (
	"encoding/json"
	"strconv"

	"github.com/casibase/casibase/object"
)

// GetScans
// @Title GetScans
// @Tag Scan API
// @Description get scans
// @Success 200 {array} object.Scan The Response object
// @router /get-scans [get]
func (c *ApiController) GetScans() {
	scans, err := object.GetScans()
	if err != nil {
		c.ResponseError(err.Error())
	}
	c.ResponseOk(scans)
}

// GetAScan
// @Title GetAScan
// @Tag Scan API
// @Description get a scan
// @Param id query string true "The id of the scan"
// @Success 200 {object} object.Scan The Response object
// @router /get-a-scan [get]
func (c *ApiController) GetAScan() {
	id := c.Input().Get("id")
	i, err := strconv.Atoi(id)
	scan, err := object.GetAAssetsConfig(i)
	if err != nil {
		c.ResponseError(err.Error())
	}
	c.ResponseOk(scan)
}

// DeleteAScan
// @Title DeleteAScan
// @Tag Scan API
// @Description delete a scan
// @Param id query string true "The id of the scan"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-a-scan [get]
func (c ApiController) DeleteAScan() {
	id := c.Input().Get("id")
	i, err := strconv.Atoi(id)
	_, err = object.DeleteAScan(i)
	if err != nil {
		c.ResponseError(err.Error())
	}
	c.ResponseOk(nil)
}

// SaveAssetsConfig
// @Title SaveAssetsConfig
// @Tag Scan API
// @Description start a scan
// @Param targets query string true "The targets of the scan"
// @Success 200 {object} controllers.Response The Response object
// @router /save-assets-config [post]
func (c *ApiController) SaveAssetsConfig() {
	var scan object.AssetsConfig
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &scan)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.SaveAssetsScanConfig(&scan)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(success)
}

// StartScan
// @Title StartScan
// @Tag Scan API
// @Description start a scan
// @Param id query string true "The id of the config"
// @Success 200 {bool} bool
// @router /start-scan [get]
func (c *ApiController) StartScan() {
	c.Ctx.ResponseWriter.Header().Set("Content-Type", "text/event-stream")
	c.Ctx.ResponseWriter.Header().Set("Cache-Control", "no-cache")
	c.Ctx.ResponseWriter.Header().Set("Connection", "keep-alive")

	writer := &RefinedWriter{*c.Ctx.ResponseWriter, *NewCleaner(12), []byte{}}

	sendMessage := func(eventType string, data string) {
		totalEvent := "event: " + eventType + "\ndata: " + data + "\n\n"
		_, err := writer.ResponseWriter.Write([]byte(totalEvent))
		writer.Flush()
		if err != nil {
			c.ResponseError(err.Error())
		}
	}

	id := c.Input().Get("id")
	i, err := strconv.Atoi(id)
	success, err := object.StartScan(i, sendMessage)
	if err != nil || !success {
		sendMessage("error", "scan error: "+err.Error())
	}

	sendMessage("end", "scan finish")
	c.ResponseOk(nil)
}
