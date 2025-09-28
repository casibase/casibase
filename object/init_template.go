package object

import (
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/beego/beego/logs"
	"gopkg.in/yaml.v3"
)

// initTemplates load template files and upsert them into DB.
func initTemplates() {
	owner := "admin"
	templatesDir := "./data/template"
	files, err := os.ReadDir(templatesDir)
	if err != nil {
		logs.Error("Failed to read template directory: %v\n", err)
	}

	for _, file := range files {
		if file.IsDir() {
			continue
		}
		if !strings.HasSuffix(file.Name(), ".yaml") && !strings.HasSuffix(file.Name(), ".yml") {
			continue
		}
		tpl, err := parseTemplateFromFile(owner, filepath.Join(templatesDir, file.Name()))
		if err != nil {
			logs.Error("Failed to parse template file %s: %v\n", file.Name(), err)
			continue
		}
		if tpl != nil {
			_, err = AddTemplate(tpl)
			if err != nil && !strings.Contains(err.Error(), "Duplicate entry") {
				logs.Error("Failed to add template %s: %v\n", tpl.Name, err)
			}
		}
	}
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
			DisplayName string                 `yaml:"displayName"`
			Description string                 `yaml:"description"`
			Version     string                 `yaml:"version"`
			Icon        string                 `yaml:"icon"`
			Readme      string                 `yaml:"readme"`
			Options     []templateConfigOption `yaml:"options"`
		} `yaml:"spec"`
	}

	if err := yaml.Unmarshal([]byte(templateYamlString), &templateYaml); err != nil {
		return nil, err
	}

	if strings.ToLower(templateYaml.Kind) != "template" {
		return nil, nil
	}

	manifest := strings.TrimSpace(strings.Join(yamls[1:], "\n---\n"))

	template := &Template{
		Owner:              owner,
		Name:               templateYaml.Metadata.Name,
		DisplayName:        templateYaml.Spec.DisplayName,
		Description:        templateYaml.Spec.Description,
		Version:            templateYaml.Spec.Version,
		Icon:               templateYaml.Spec.Icon,
		Readme:             templateYaml.Spec.Readme,
		EnableBasicConfig:  true,
		BasicConfigOptions: templateYaml.Spec.Options,
		Manifest:           manifest,
	}

	return template, nil
}
