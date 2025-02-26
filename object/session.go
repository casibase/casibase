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

type Session struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`

	StartTime string `xorm:"varchar(100)" json:"startTime"`
	EndTime   string `xorm:"varchar(100)" json:"endTime"`

	Protocol      string `xorm:"varchar(20)" json:"protocol"`
	ConnectionId  string `xorm:"varchar(50)" json:"connectionId"`
	Asset         string `xorm:"varchar(200) index" json:"asset"`
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

func (s *Session) GetId() string {
	return util.GetIdFromOwnerAndName(s.Owner, s.Name)
}

func GetSessionCount(owner, status, field, value string) (int64, error) {
	session := GetSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Session{Status: status})
}

func GetSessions(owner string) ([]*Session, error) {
	sessions := []*Session{}
	err := adapter.engine.Desc("connected_time").Find(&sessions, &Session{Owner: owner})
	if err != nil {
		return sessions, err
	}

	return sessions, nil
}

func GetPaginationSessions(owner, status string, offset, limit int, field, value, sortField, sortOrder string) ([]*Session, error) {
	sessions := []*Session{}
	session := GetSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&sessions, &Session{Status: status})
	if err != nil {
		return sessions, err
	}

	return sessions, nil
}

func GetSessionsByStatus(statuses []string) ([]*Session, error) {
	sessions := []*Session{}
	err := adapter.engine.In("status", statuses).Find(&sessions)
	if err != nil {
		return sessions, err
	}
	return sessions, nil
}

func getSession(owner string, name string) (*Session, error) {
	if owner == "" || name == "" {
		return nil, nil
	}

	session := Session{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&session)
	if err != nil {
		return &session, err
	}

	if existed {
		return &session, nil
	} else {
		return nil, nil
	}
}

func GetConnSession(id string) (*Session, error) {
	owner, name := util.GetOwnerAndNameFromIdNoCheck(id)
	return getSession(owner, name)
}

func UpdateSession(id string, session *Session, columns ...string) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	if oldSession, err := getSession(owner, name); err != nil {
		return false, err
	} else if oldSession == nil {
		return false, nil
	}

	if len(columns) == 0 {
		_, err := adapter.engine.ID(core.PK{owner, name}).AllCols().Update(session)
		if err != nil {
			return false, err
		}
	} else {
		_, err := adapter.engine.ID(core.PK{owner, name}).Cols(columns...).Update(session)
		if err != nil {
			return false, err
		}
	}

	return true, nil
}

func DeleteSession(session *Session) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{session.Owner, session.Name}).Delete(&Session{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteSessionById(id string) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return DeleteSession(&Session{Owner: owner, Name: name})
}

func AddSession(session *Session) (bool, error) {
	affected, err := adapter.engine.Insert(session)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func CreateSession(session *Session, machineId string, mode string) (*Session, error) {
	machine, err := GetMachine(machineId)
	if err != nil {
		return nil, err
	}

	if machine == nil {
		return nil, nil
	}

	session.Owner = machine.Owner
	session.Name = util.GenerateId()
	session.CreatedTime = util.GetCurrentTime()
	session.Protocol = machine.RemoteProtocol
	session.Asset = machineId
	session.Status = NoConnect
	session.Mode = mode
	session.Reviewed = false
	session.Operations = []string{"paste", "copy", "createDir", "edit", "rename", "delete", "download", "upload", "fileSystem"}

	_, err = AddSession(session)
	if err != nil {
		return nil, err
	}

	respSession := &Session{
		Owner:      session.Owner,
		Name:       session.Name,
		Protocol:   machine.RemoteProtocol,
		Operations: session.Operations,
	}
	return respSession, nil
}

func CloseDBSession(id string, code int, msg string) error {
	s, err := GetConnSession(id)
	if err != nil {
		return err
	}
	if s == nil {
		return nil
	}

	if s.Status == Disconnected {
		return nil
	}

	if s.Status == Connecting {
		// The session has not been established successfully, so you do not need to save data
		_, err := DeleteSession(s)
		if err != nil {
			return err
		}
		return nil
	}

	s.Status = Disconnected
	s.Code = code
	s.Message = msg
	s.EndTime = util.GetCurrentTime()

	_, err = UpdateSession(id, s)
	if err != nil {
		return err
	}
	return nil
}

func WriteCloseMessage(session *guacamole.Session, mode string, code int, msg string) {
	err := guacamole.NewInstruction("error", "", strconv.Itoa(code))
	_ = session.WriteString(err.String())
	disconnect := guacamole.NewInstruction("disconnect")
	_ = session.WriteString(disconnect.String())
}

var mutex sync.Mutex

func CloseSession(id string, code int, msg string) error {
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

	err := CloseDBSession(id, code, msg)
	if err != nil {
		return err
	}

	return nil
}
