package controllers

import (
    "encoding/json"

    "github.com/casibase/casibase/object"
)

// CreateRecordObjectFix
// @Title CreateRecordObjectFix
// @Tag Bugfix API
// @Description create a record object fix task
// @Param body body string true "JSON object with fields {taskType, params}" 
// @Success 200 {object} controllers.Response The Response object
// @router /bugfix/create-record-object-fix [post]
func (c *ApiController) BugFixCreate() {
    // Expecting body like { "taskType": "fixRecordObject", "params": { ... } }
    var body struct {
        TaskType string      `json:"taskType"`
        Params   interface{} `json:"params"`
    }

    if err := json.Unmarshal(c.Ctx.Input.RequestBody, &body); err != nil {
        c.ResponseError(err.Error())
        return
    }

    paramsBytes, _ := json.Marshal(body.Params)
    taskId, err := object.BUGFIX_CreateBugFixTask(body.TaskType, string(paramsBytes))
    if err != nil {
        c.ResponseError(err.Error())
        return
    }

    c.ResponseOk(taskId)
}

// GetCurrentRecordObjectFix
// @Title GetCurrentRecordObjectFix
// @Tag Bugfix API
// @Description get current running/fetched bugfix task
// @Success 200 {object} controllers.Response The Response object
// @router /bugfix/get-current-record-object-fix [get]
func (c *ApiController) BugFixGetCurrent() {
    taskJson := object.BUGFIX_getCurrentTask()
    // BUGFIX_getCurrentTask returns JSON string
    var data interface{}
    if err := json.Unmarshal([]byte(taskJson), &data); err != nil {
        // fallback: return raw string
        c.ResponseOk(taskJson)
        return
    }
    c.ResponseOk(data)
}

// StopRecordObjectFix
// @Title StopRecordObjectFix
// @Tag Bugfix API
// @Description stop current bugfix task
// @Success 200 {object} controllers.Response The Response object
// @router /bugfix/stop-record-object-fix [post]
func (c *ApiController) BugfixStop() {
    if err := object.BUGFIX_stopCurrentTask(); err != nil {
        c.ResponseError(err.Error())
        return
    }
    c.ResponseOk(true)
}
