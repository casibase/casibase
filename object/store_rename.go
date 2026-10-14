// Copyright 2026 The OpenAgent Authors. All Rights Reserved.
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
	"strings"

	"github.com/the-open-agent/openagent/util"
	"xorm.io/core"
	"xorm.io/xorm"
)

func renameStoreReferences(session *xorm.Session, oldOwner string, oldName string, newOwner string, newName string) error {
	files := []*File{}
	err := session.Where("owner = ? and store = ?", oldOwner, oldName).Find(&files)
	if err != nil {
		return err
	}

	prefix := oldName + "_"
	for _, file := range files {
		fileName := file.Name
		if strings.HasPrefix(fileName, prefix) {
			fileName = getFileName(newName, strings.TrimPrefix(fileName, prefix))
		}

		_, err = session.ID(core.PK{file.Owner, file.Name}).Cols("owner", "name", "store").Update(&File{Owner: newOwner, Name: fileName, Store: newName})
		if err != nil {
			return err
		}
	}

	if newName != oldName {
		for _, bean := range []interface{}{&Vector{}, &Chat{}, &Message{}, &Experience{}, &Issue{}, &Pipe{}, &ToolPolicy{}} {
			_, err = session.Table(bean).Where("store = ?", oldName).Update(map[string]interface{}{"store": newName})
			if err != nil {
				return err
			}
		}
	}

	for _, bean := range []interface{}{&StoreVisit{}, &StoreFavorite{}, &Notification{}} {
		_, err = session.Table(bean).Where("store_owner = ? and store_name = ?", oldOwner, oldName).Update(map[string]interface{}{"store_owner": newOwner, "store_name": newName})
		if err != nil {
			return err
		}
	}

	_, err = session.Table(&Store{}).Where("forked_from_owner = ? and forked_from_name = ?", oldOwner, oldName).Update(map[string]interface{}{"forked_from_owner": newOwner, "forked_from_name": newName})
	if err != nil {
		return err
	}

	_, err = session.Table(&Comment{}).Where("target_type = ? and target_key = ?", CommentTargetTypeAgentHub, util.GetIdFromOwnerAndName(oldOwner, oldName)).Update(map[string]interface{}{"target_key": util.GetIdFromOwnerAndName(newOwner, newName)})
	return err
}
