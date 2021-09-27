// Copyright 2021 The casbin Authors. All Rights Reserved.
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

    "github.com/casbin/casnode/object"
    "github.com/casbin/casnode/util"
)

func (c *ApiController) GetNotesByParent() {
    parent := c.Input().Get("parent")
    user := c.GetSessionUser()

    c.Data["json"] = object.GetNotesByParent(user.Name,parent)
    c.ServeJSON()
}

func (c *ApiController) GetNote()  {
    idStr := c.Input().Get("id")

    id := util.ParseInt(idStr)
    note := object.GetNote(id)

    if note.User != c.GetSessionUser().Name{
        c.Data["json"] = &object.Note{}
        c.ServeJSON()
        return
    }

    c.Data["json"] = note
    c.ServeJSON()
}

func (c *ApiController) AddNote()  {
    if c.RequireSignedIn() {
        return
    }

    user := c.GetSessionUser()

    note := object.Note{
        User: user.Name,
        Deleted: false,
    }

    err := json.Unmarshal(c.Ctx.Input.RequestBody, &note)
    if err != nil {
        panic(err)
    }

    affected := object.AddNote(&note)

    c.ResponseOk(affected)
}

func (c *ApiController) DeleteNote()  {
    if c.RequireSignedIn() {
        return
    }

    id := util.ParseInt(c.Input().Get("id"))
    user := c.GetSessionUser()

    if object.GetNote(id).User != user.Name{
        return
    }

    affected := object.DeleteNote(id)

    c.ResponseOk(affected)
}

func (c *ApiController) UpdateNote()  {
    if c.RequireSignedIn() {
        return
    }

    user := c.GetSessionUser()

    note := object.Note{}

    err := json.Unmarshal(c.Ctx.Input.RequestBody, &note)
    if err != nil {
        panic(err)
    }

    if note.User != user.Name{
        return
    }

    affected := object.UpdateNote(note.Id,&note)

    c.ResponseOk(affected)
}

