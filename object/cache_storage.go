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
    "github.com/casibase/casibase/util"
)

// CacheStorage 映射到数据库表 cache_storage
type CacheStorage struct {
    Id         uint64 `xorm:"bigint unsigned notnull pk autoincr" json:"id"`
    CacheKey   string `xorm:"varchar(255) notnull unique" json:"cacheKey"`
    CacheJson  string `xorm:"varchar(60535) notnull" json:"cacheJson"`
    UpdateTime string `xorm:"datetime notnull updated" json:"updateTime"`
}

// SaveToCache 保存或更新缓存数据（传入 key 和 json bytes）
// 如果已有记录则更新 cache_json 字段并刷新更新时间；否则插入新记录。
func CacheSave(cacheKey string, cacheStr string) error {
	cacheData := []byte(cacheStr)
    if cacheKey == "" {
        return nil
    }

    // 尝试查找已有记录
    cs := CacheStorage{CacheKey: cacheKey}
    existed, err := adapter.engine.Get(&cs)
    if err != nil {
        return err
    }

    if existed {
        // 更新 cache_json 字段及更新时间
        cs.CacheJson = string(cacheData)
        cs.UpdateTime = util.GetCurrentTime()
        _, err = adapter.engine.ID(cs.Id).Cols("cache_json", "update_time").Update(&cs)
        if err != nil {
            return err
        }
        return nil
    }

    // 不存在则插入新记录
    newCs := &CacheStorage{
        CacheKey:   cacheKey,
        CacheJson:  string(cacheData),
        UpdateTime: util.GetCurrentTime(),
    }
    _, err = adapter.engine.Insert(newCs)
    if err != nil {
        return err
    }

    return nil
}

// GetCacheByKey 根据 cache_key 获取存储的 JSON 数据，找不到返回 (nil, nil)
func GetCacheByKey(cacheKey string) ([]byte, error) {
    if cacheKey == "" {
        return nil, nil
    }

    cs := CacheStorage{CacheKey: cacheKey}
    existed, err := adapter.engine.Get(&cs)
    if err != nil {
        return nil, err
    }

    if !existed {
        return nil, nil
    }

    return []byte(cs.CacheJson), nil
}
