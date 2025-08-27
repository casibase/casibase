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
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"text/template"

	"github.com/casibase/casibase/util"
	"gopkg.in/yaml.v3"
	"xorm.io/core"
)

type Template struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	UpdatedTime string `xorm:"varchar(100)" json:"updatedTime"`

	DisplayName string `xorm:"varchar(100)" json:"displayName"`
	Description string `xorm:"varchar(255)" json:"description"`
	Version     string `xorm:"varchar(50)" json:"version"`
	Icon        string `xorm:"varchar(255)" json:"icon"`
	Manifest    string `xorm:"mediumtext" json:"manifest"`

	NeedRender bool            `xorm:"bool" json:"needRender"`
	Inputs     []TemplateInput `xorm:"json" json:"inputs"`
}

type TemplateInput struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Type        string   `json:"type"` // string
	Options     []string `json:"options"`
	Default     string   `json:"default"`
	Required    bool     `json:"required"`
}

func GetTemplates(owner string) ([]*Template, error) {
	templates := []*Template{}
	err := adapter.engine.Desc("created_time").Find(&templates, &Template{Owner: owner})
	if err != nil {
		return templates, err
	}
	return templates, nil
}

func GetTemplateCount(owner, field, value string) (int64, error) {
	session := GetDbSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Template{})
}

func GetPaginationTemplates(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Template, error) {
	templates := []*Template{}
	session := GetDbSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&templates)
	if err != nil {
		return templates, err
	}

	return templates, nil
}

func GetTemplate(id string) (*Template, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getTemplate(owner, name)
}

func getTemplate(owner, name string) (*Template, error) {
	template := Template{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&template)
	if err != nil {
		return &template, err
	}

	if existed {
		return &template, nil
	} else {
		return nil, nil
	}
}

func UpdateTemplate(id string, template *Template) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	template.UpdatedTime = util.GetCurrentTime()
	_, err := getTemplate(owner, name)
	if err != nil {
		return false, err
	}
	if template == nil {
		return false, nil
	}

	affected, err := adapter.engine.ID(core.PK{owner, name}).AllCols().Update(template)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func AddTemplate(template *Template) (bool, error) {
	if template.CreatedTime == "" {
		template.CreatedTime = util.GetCurrentTime()
	}
	if template.UpdatedTime == "" {
		template.UpdatedTime = util.GetCurrentTime()
	}

	affected, err := adapter.engine.Insert(template)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteTemplate(template *Template) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{template.Owner, template.Name}).Delete(&Template{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

// upsertTemplate inserts or updates the template in the database.
func upsertTemplate(templates *Template) error {
	existing, err := getTemplate(templates.Owner, templates.Name)
	if err != nil {
		return err
	}
	if existing != nil {
		_, err := UpdateTemplate(util.GetIdFromOwnerAndName(templates.Owner, templates.Name), templates)
		if err != nil {
			return err
		}
	} else {
		_, err := AddTemplate(templates)
		if err != nil {
			return err
		}
	}
	return nil
}

// initTemplates load template files and upsert them into DB.
func initTemplates() {
	owner := "admin"
	dir := "./template"
	files, err := os.ReadDir(dir)
	if err != nil {
		fmt.Printf("Failed to read template directory: %v\n", err)
	}

	for _, file := range files {
		if file.IsDir() {
			continue
		}
		if !strings.HasSuffix(file.Name(), ".yaml") && !strings.HasSuffix(file.Name(), ".yml") {
			continue
		}
		tpl, err := parseTemplateFromFile(owner, filepath.Join(dir, file.Name()))
		if err != nil {
			fmt.Printf("Failed to parse template file %s: %v\n", file.Name(), err)
		}
		if tpl != nil {
			upsertTemplate(tpl)
		}
	}
}

// Render the template with the given data.
func (t *Template) Render(data map[string]interface{}) (string, error) {
	if data == nil {
		data = map[string]interface{}{}
	}

	textTmpl := template.New("manifest")
	tpl, err := textTmpl.Parse(t.Manifest)
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	if err := tpl.Execute(&buf, data); err != nil {
		return "", err
	}

	return buf.String(), nil
}

// parseTemplateFromFile parses a single template file.
func parseTemplateFromFile(owner, path string) (*Template, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	sepRe := regexp.MustCompile(`(?m)^\s*---\s*$`)
	yamls := sepRe.Split(string(b), -1)
	if len(yamls) == 0 {
		return nil, nil
	}

	templateYamlString := strings.TrimSpace(yamls[0])
	if templateYamlString == "" {
		return nil, nil
	}

	var templateYaml struct {
		APIVersion string `yaml:"apiVersion"`
		Kind       string `yaml:"kind"`
		Metadata   struct {
			Name string `yaml:"name"`
		} `yaml:"metadata"`
		Spec struct {
			DisplayName string `yaml:"displayName"`
			Description string `yaml:"description"`
			Version     string `yaml:"version"`
			Icon        string `yaml:"icon"`
			Inputs      []struct {
				Name        string   `yaml:"name"`
				Description string   `yaml:"description"`
				Type        string   `yaml:"type"`
				Options     []string `yaml:"options"`
				Default     string   `yaml:"default"`
				Required    bool     `yaml:"required"`
			} `yaml:"inputs"`
		} `yaml:"spec"`
	}

	if err := yaml.Unmarshal([]byte(templateYamlString), &templateYaml); err != nil {
		return nil, err
	}

	if strings.ToLower(templateYaml.Kind) != "template" {
		return nil, nil
	}

	template := &Template{Owner: owner}
	template.Name = templateYaml.Metadata.Name
	template.DisplayName = templateYaml.Spec.DisplayName
	template.Description = templateYaml.Spec.Description
	template.Version = templateYaml.Spec.Version
	template.Icon = templateYaml.Spec.Icon
	template.NeedRender = true

	if len(templateYaml.Spec.Inputs) > 0 {
		inputs := make([]TemplateInput, 0, len(templateYaml.Spec.Inputs))
		for _, input := range templateYaml.Spec.Inputs {
			templateInput := TemplateInput{
				Name:        input.Name,
				Description: input.Description,
				Type:        input.Type,
				Options:     input.Options,
				Required:    input.Required,
			}
			if input.Default != "" {
				templateInput.Default = input.Default
			}
			inputs = append(inputs, templateInput)
		}
		template.Inputs = inputs
	}

	if len(yamls) > 1 {
		template.Manifest = strings.TrimSpace(strings.Join(yamls[1:], "\n---\n"))
	}

	return template, nil
}
