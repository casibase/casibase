package object

import (
	"encoding/json"
	"io/ioutil"
	"sync"

	"github.com/casbin/casibase/util"
	"github.com/casibase/go-hnsw"
)

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

func (h *HNSWIndex) Search(vector []float32) (*Vector, error) {
	result := h.Hnsw.Search(vector, 100, 4)
	item := result.Pop()
	owner, name := util.GetOwnerAndNameFromId(h.IdToStr[item.ID])
	return getVector(owner, name)
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
