// Copyright 2023 The casbin Authors. All Rights Reserved.
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
	"encoding/json"
	"io/ioutil"
	"sync"

	"github.com/casibase/casibase/util"
	"github.com/casibase/go-hnsw"
)

type HnswSearchProvider struct{}

func NewHnswSearchProvider() (*HnswSearchProvider, error) {
	return &HnswSearchProvider{}, nil
}

func (p *HnswSearchProvider) Search(qVector []float32) ([]Vector, error) {
	return Index.Search(qVector)
}

var Index *HNSWIndex

const (
	M              = 64
	efConstruction = 400
)

type HNSWIndex struct {
	Hnsw    *hnsw.Hnsw        `json:"-"`
	Lock    sync.RWMutex      `json:"-"`
	Id      uint32            `json:"id,omitempty"`
	IdToStr map[uint32]string `json:"id_to_str,omitempty"`
	StrToId map[string]uint32 `json:"str_to_id,omitempty"`
}

func InitHNSW() {
	Index = &HNSWIndex{}
	err := Index.load()
	if err != nil {
		Index.IdToStr = make(map[uint32]string)
		Index.StrToId = make(map[string]uint32)
		Index.Hnsw = hnsw.New(M, efConstruction, make([]float32, 128))
	}
}

func (h *HNSWIndex) Add(name string, vector []float32) error {
	h.Lock.Lock()
	h.Id++
	id := h.Id
	h.IdToStr[id] = name
	h.StrToId[name] = id
	h.Lock.Unlock()
	h.Hnsw.Grow(int(id + 1))
	h.Hnsw.Add(vector, id)
	return h.save()
}

func (h *HNSWIndex) Search(vector []float32) ([]Vector, error) {
	result := h.Hnsw.Search(vector, 100, 4)
	item := result.Pop()

	owner, name := util.GetOwnerAndNameFromId(h.IdToStr[item.ID])
	v, err := getVector(owner, name)
	if err != nil {
		return nil, err
	}
	return []Vector{*v}, nil
}

func (h *HNSWIndex) save() error {
	h.Lock.RLock()
	defer h.Lock.RUnlock()

	data, err := json.Marshal(h)
	if err != nil {
		return err
	}

	err = ioutil.WriteFile("./hnsw", data, 0o644)
	if err != nil {
		return err
	}

	err = h.Hnsw.Save("./index")
	if err != nil {
		return err
	}

	return nil
}

func (h *HNSWIndex) load() error {
	h.Lock.Lock()
	defer h.Lock.Unlock()

	data, err := ioutil.ReadFile("./hnsw")
	if err != nil {
		return err
	}

	err = json.Unmarshal(data, h)
	if err != nil {
		return err
	}

	h.Hnsw, _, err = hnsw.Load("./index")
	if err != nil {
		return err
	}

	return nil
}
