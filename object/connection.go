// Copyright 2024 The Casibase Authors. All Rights Reserved.
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
	"strconv"
	"sync"

	"github.com/casibase/casibase/util"
	"github.com/casibase/casibase/util/guacamole"
	"xorm.io/core"
)

const (
	NoConnect    = "no_connect"
	Connecting   = "connecting"
	Connected    = "connected"
	Disconnected = "disconnected"
)

type Connection struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`

	StartTime string `xorm:"varchar(100)" json:"startTime"`
	EndTime   string `xorm:"varchar(100)" json:"endTime"`

	Protocol      string `xorm:"varchar(20)" json:"protocol"`
	ConnectionId  string `xorm:"varchar(50)" json:"connectionId"`
	Node          string `xorm:"varchar(200) index" json:"node"`
	Creator       string `xorm:"varchar(36) index" json:"creator"`
	ClientIp      string `xorm:"varchar(200)" json:"clientIp"`
	UserAgent     string `xorm:"varchar(200)" json:"userAgent"`
	ClientIpDesc  string `xorm:"varchar(100)" json:"clientIpDesc"`
	UserAgentDesc string `xorm:"varchar(100)" json:"userAgentDesc"`
	Width         int    `json:"width"`
	Height        int    `json:"height"`
	Status        string `xorm:"varchar(20) index" json:"status"`
	Recording     string `xorm:"varchar(1000)" json:"recording"`
	Code          int    `json:"code"`
	Message       string `json:"message"`

	Mode       string   `xorm:"varchar(10)" json:"mode"`
	Operations []string `xorm:"json varchar(1000)" json:"operations"`

	Reviewed     bool  `json:"reviewed"`
	CommandCount int64 `json:"commandCount"`
}

func (s *Connection) GetId() string {
	return util.GetIdFromOwnerAndName(s.Owner, s.Name)
}

func GetConnectionCount(owner, status, field, value string) (int64, error) {
	session := GetDbSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Connection{Status: status})
}

func GetConnections(owner string) ([]*Connection, error) {
	connections := []*Connection{}
	err := adapter.engine.Desc("connected_time").Find(&connections, &Connection{Owner: owner})
	if err != nil {
		return connections, err
	}

	return connections, nil
}

func GetPaginationConnections(owner, status string, offset, limit int, field, value, sortField, sortOrder string) ([]*Connection, error) {
	connections := []*Connection{}
	session := GetDbSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&connections, &Connection{Status: status})
	if err != nil {
		return connections, err
	}

	return connections, nil
}

func GetSessionsByStatus(statuses []string) ([]*Connection, error) {
	connections := []*Connection{}
	err := adapter.engine.In("status", statuses).Find(&connections)
	if err != nil {
		return connections, err
	}
	return connections, nil
}

func getConnection(owner string, name string) (*Connection, error) {
	if owner == "" || name == "" {
		return nil, nil
	}

	connection := Connection{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&connection)
	if err != nil {
		return &connection, err
	}

	if existed {
		return &connection, nil
	} else {
		return nil, nil
	}
}

func GetConnection(id string) (*Connection, error) {
	owner, name := util.GetOwnerAndNameFromIdNoCheck(id)
	return getConnection(owner, name)
}

func UpdateConnection(id string, connection *Connection, columns ...string) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	if oldConnection, err := getConnection(owner, name); err != nil {
		return false, err
	} else if oldConnection == nil {
		return false, nil
	}

	if len(columns) == 0 {
		_, err := adapter.engine.ID(core.PK{owner, name}).AllCols().Update(connection)
		if err != nil {
			return false, err
		}
	} else {
		_, err := adapter.engine.ID(core.PK{owner, name}).Cols(columns...).Update(connection)
		if err != nil {
			return false, err
		}
	}

	return true, nil
}

func DeleteConnection(connection *Connection) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{connection.Owner, connection.Name}).Delete(&Connection{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteConnectionById(id string) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return DeleteConnection(&Connection{Owner: owner, Name: name})
}

func AddConnection(connection *Connection) (bool, error) {
	affected, err := adapter.engine.Insert(connection)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func CreateConnection(connection *Connection, nodeId string, mode string) (*Connection, error) {
	node, err := GetNode(nodeId)
	if err != nil {
		return nil, err
	}

	if node == nil {
		return nil, nil
	}

	connection.Owner = node.Owner
	connection.Name = util.GenerateId()
	connection.CreatedTime = util.GetCurrentTime()
	connection.Protocol = node.RemoteProtocol
	connection.Node = nodeId
	connection.Status = NoConnect
	connection.Mode = mode
	connection.Reviewed = false
	connection.Operations = []string{"paste", "copy", "createDir", "edit", "rename", "delete", "download", "upload", "fileSystem"}

	_, err = AddConnection(connection)
	if err != nil {
		return nil, err
	}

	respConnection := &Connection{
		Owner:      connection.Owner,
		Name:       connection.Name,
		Protocol:   node.RemoteProtocol,
		Operations: connection.Operations,
	}
	return respConnection, nil
}

func CloseDbSession(id string, code int, msg string) error {
	connection, err := GetConnection(id)
	if err != nil {
		return err
	}
	if connection == nil {
		return nil
	}

	if connection.Status == Disconnected {
		return nil
	}

	if connection.Status == Connecting {
		// The session has not been established successfully, so you do not need to save data
		_, err := DeleteConnection(connection)
		if err != nil {
			return err
		}
		return nil
	}

	connection.Status = Disconnected
	connection.Code = code
	connection.Message = msg
	connection.EndTime = util.GetCurrentTime()

	_, err = UpdateConnection(id, connection)
	if err != nil {
		return err
	}
	return nil
}

func WriteCloseMessage(guacSession *guacamole.Session, mode string, code int, msg string) {
	err := guacamole.NewInstruction("error", "", strconv.Itoa(code))
	_ = guacSession.WriteString(err.String())
	disconnect := guacamole.NewInstruction("disconnect")
	_ = guacSession.WriteString(disconnect.String())
}

var mutex sync.Mutex

func CloseConnection(id string, code int, msg string) error {
	mutex.Lock()
	defer mutex.Unlock()
	guacSession := guacamole.GlobalSessionManager.Get(id)

	if guacSession != nil {
		WriteCloseMessage(guacSession, guacSession.Mode, code, msg)

		if guacSession.Observer != nil {
			guacSession.Observer.Range(func(key string, ob *guacamole.Session) {
				WriteCloseMessage(ob, ob.Mode, code, msg)
			})
		}
	}
	guacamole.GlobalSessionManager.Delete(id)

	err := CloseDbSession(id, code, msg)
	if err != nil {
		return err
	}

	return nil
}
