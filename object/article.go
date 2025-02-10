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
	"fmt"

	"github.com/casibase/casibase/util"
	"xorm.io/core"
)

type Block struct {
	Type   string `json:"type"`
	Text   string `json:"text"`
	TextEn string `json:"textEn"`
	Prompt string `json:"prompt"`
	State  string `json:"state"`
}

type Article struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`

	DisplayName string `xorm:"varchar(100)" json:"displayName"`
	Provider    string `xorm:"varchar(100)" json:"provider"`
	Type        string `xorm:"varchar(100)" json:"type"`

	Text     string   `xorm:"mediumtext" json:"text"`
	Content  []*Block `xorm:"mediumtext" json:"content"`
	Glossary []string `xorm:"varchar(200)" json:"glossary"`
}

func GetMaskedArticle(article *Article, isMaskEnabled bool) *Article {
	if !isMaskEnabled {
		return article
	}

	if article == nil {
		return nil
	}

	return article
}

func GetMaskedArticles(articles []*Article, isMaskEnabled bool) []*Article {
	if !isMaskEnabled {
		return articles
	}

	for _, article := range articles {
		article = GetMaskedArticle(article, isMaskEnabled)
		article.Content = nil
	}
	return articles
}

func GetGlobalArticles() ([]*Article, error) {
	articles := []*Article{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&articles)
	if err != nil {
		return articles, err
	}

	return articles, nil
}

func GetArticles(owner string) ([]*Article, error) {
	articles := []*Article{}
	err := adapter.engine.Desc("created_time").Find(&articles, &Article{Owner: owner})
	if err != nil {
		return articles, err
	}

	return articles, nil
}

func getArticle(owner string, name string) (*Article, error) {
	article := Article{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&article)
	if err != nil {
		return &article, err
	}

	if existed {
		return &article, nil
	} else {
		return nil, nil
	}
}

func GetArticle(id string) (*Article, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getArticle(owner, name)
}

func GetArticleCount(owner, field, value string) (int64, error) {
	session := GetSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Article{})
}

func GetPaginationArticles(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Article, error) {
	articles := []*Article{}
	session := GetSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&articles)
	if err != nil {
		return articles, err
	}

	return articles, nil
}

func UpdateArticle(id string, article *Article) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	_, err := getArticle(owner, name)
	if err != nil {
		return false, err
	}
	if article == nil {
		return false, nil
	}

	_, err = adapter.engine.ID(core.PK{owner, name}).AllCols().Update(article)
	if err != nil {
		return false, err
	}

	// return affected != 0
	return true, nil
}

func AddArticle(article *Article) (bool, error) {
	affected, err := adapter.engine.Insert(article)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteArticle(article *Article) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{article.Owner, article.Name}).Delete(&Article{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (article *Article) GetId() string {
	return fmt.Sprintf("%s/%s", article.Owner, article.Name)
}
