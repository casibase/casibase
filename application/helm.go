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

package application

import (
	"fmt"
	"strings"

	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/chart/loader"
	"helm.sh/helm/v3/pkg/chartutil"
	"helm.sh/helm/v3/pkg/cli"
	"helm.sh/helm/v3/pkg/engine"
	"helm.sh/helm/v3/pkg/getter"
	"helm.sh/helm/v3/pkg/repo"
)

// ReleaseOptions provides configuration options for chart rendering
type ReleaseOptions struct {
	chartutil.ReleaseOptions
	Values       map[string]interface{}
	Capabilities *chartutil.Capabilities
	ReleaseName  string
	IncludeCrds  bool
	SkipTests    bool
	DisableHooks bool
	DryRun       bool
}

// RenderedChart represents the result of rendering a chart
type RenderedChart struct {
	ChartName    string `json:"chartName"`
	ChartVersion string `json:"chartVersion"`
	ReleaseName  string `json:"releaseName"`
	Namespace    string `json:"namespace"`
	RenderedYaml string `json:"renderedYaml"`
}

// GetHelmIndexFromUrl retrieves the Helm chart repository index from a URL
func GetHelmIndexFromUrl(url string) (*repo.IndexFile, error) {
	settings := cli.New()
	getter := getter.All(settings)

	entry := &repo.Entry{
		URL: url,
	}

	r, err := repo.NewChartRepository(entry, getter)
	if err != nil {
		return nil, err
	}

	indexFile, err := r.DownloadIndexFile()
	if err != nil {
		return nil, err
	}

	idx, err := repo.LoadIndexFile(indexFile)
	if err != nil {
		return nil, err
	}
	return idx, nil
}

// GetChartContentFromUrl fetches and loads chart
func GetChartContentFromUrl(chartUrl string) (*chart.Chart, error) {
	var client getter.Getter
	var err error
	if strings.HasPrefix(chartUrl, "oci://") {
		client, err = getter.NewOCIGetter()
		if err != nil {
			return nil, fmt.Errorf("failed to create registry client: %v", err)
		}
	}

	if strings.HasPrefix(chartUrl, "http://") || strings.HasPrefix(chartUrl, "https://") {
		client, err = getter.NewHTTPGetter()
		if err != nil {
			return nil, fmt.Errorf("failed to create HTTP getter: %v", err)
		}
	}

	if client == nil {
		return nil, fmt.Errorf("unsupported chart URL scheme: %s", chartUrl)
	}

	data, err := client.Get(chartUrl)
	if err != nil {
		return nil, fmt.Errorf("failed to get chart data: %v", err)
	}

	chart, err := loader.LoadArchive(data)
	if err != nil {
		return nil, fmt.Errorf("failed to load pulled chart archive: %v", err)
	}

	return chart, nil
}

// GetRenderChart renders a chart using Helm engine with proper SDK usage
func GetRenderChart(chart *chart.Chart, options *ReleaseOptions) (*RenderedChart, error) {
	if chart == nil {
		return nil, fmt.Errorf("empty chart content")
	}

	if options == nil {
		options = &ReleaseOptions{}
	}
	if options.Name == "" {
		options.Name = chart.Metadata.Name
	}
	if options.Namespace == "" {
		options.Namespace = "default"
	}
	if options.Revision == 0 {
		options.Revision = 1
	}
	if !options.IsUpgrade {
		options.IsInstall = true
	}
	if options.Capabilities == nil {
		options.Capabilities = chartutil.DefaultCapabilities
	}

	renderValues, err := chartutil.ToRenderValues(chart, options.Values, options.ReleaseOptions, options.Capabilities)
	if err != nil {
		return nil, fmt.Errorf("failed to prepare render values: %v", err)
	}

	// Render templates using Helm engine
	templateEngine := engine.Engine{
		EnableDNS: false,
	}

	renderedTemplates, err := templateEngine.Render(chart, renderValues)
	if err != nil {
		return nil, fmt.Errorf("failed to render chart templates: %v", err)
	}

	var renderedYaml strings.Builder
	for templateName, content := range renderedTemplates {
		if strings.TrimSpace(content) == "" || strings.Contains(templateName, "NOTES.txt") {
			continue
		}

		if renderedYaml.Len() > 0 {
			renderedYaml.WriteString("---\n")
		}
		renderedYaml.WriteString(content)
		if !strings.HasSuffix(content, "\n") {
			renderedYaml.WriteString("\n")
		}
	}

	return &RenderedChart{
		ChartName:    chart.Metadata.Name,
		ChartVersion: chart.Metadata.Version,
		ReleaseName:  options.ReleaseName,
		Namespace:    options.Namespace,
		RenderedYaml: renderedYaml.String(),
	}, nil
}
