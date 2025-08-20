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
	"encoding/json"
	"fmt"
	"strings"

	"github.com/casibase/casibase/application"
	"github.com/casibase/casibase/util"
	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/chartutil"
	"xorm.io/core"
)

type ApplicationChart struct {
	Owner         string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name          string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime   string `xorm:"varchar(100)" json:"createdTime"`
	UpdatedTime   string `xorm:"varchar(100)" json:"updatedTime"`
	RepositoryUrl string `xorm:"varchar(255)" json:"repositoryUrl"`

	DisplayName string `xorm:"varchar(100)" json:"displayName"`
	Description string `xorm:"varchar(255)" json:"description"`
	Status      string `xorm:"varchar(50)" json:"status"`
	Namespace   string `xorm:"varchar(100)" json:"namespace"`

	// Fields for Helm charts repository support
	ApiVersion  string `xorm:"varchar(50)" json:"apiVersion"`
	Version     string `xorm:"varchar(50)" json:"version"`
	AppVersion  string `xorm:"varchar(50)" json:"appVersion"`
	Type        string `xorm:"varchar(50)" json:"type"`
	ChartUrl    string `xorm:"varchar(255)" json:"chartUrl"`
	IconUrl     string `xorm:"varchar(255)" json:"iconUrl"`
	Keywords    string `xorm:"varchar(500)" json:"keywords"`
	Home        string `xorm:"varchar(255)" json:"home"`
	Sources     string `xorm:"mediumtext" json:"sources"`
	Maintainers string `xorm:"mediumtext" json:"maintainers"`
}

// ChartContent
type ChartContent struct {
	*chart.Chart
	ApplicationChart *ApplicationChart `json:"applicationChart"`
}

// ChartReleaseOptions
type ChartReleaseOptions struct {
	chartutil.ReleaseOptions
	Chart  *chart.Chart           `json:"chart"`
	Values map[string]interface{} `json:"values"`
}

// getApplicationChart retrieves an application chart by its owner and name
func getApplicationChart(owner, name string) (*ApplicationChart, error) {
	applicationChart := ApplicationChart{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&applicationChart)
	if err != nil {
		return &applicationChart, err
	}

	if existed {
		return &applicationChart, nil
	} else {
		return nil, nil
	}
}

// GetApplicationChart retrieves an application chart by its ID
func GetApplicationChart(id string) (*ApplicationChart, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getApplicationChart(owner, name)
}

func GetApplicationChartCount(owner, field, value string) (int64, error) {
	session := GetDbSession(owner, -1, -1, field, value, "", "")
	return session.Count(&ApplicationChart{})
}

// GetApplicationCharts retrieves all application charts for a given owner
func GetApplicationCharts(owner string) ([]*ApplicationChart, error) {
	ApplicationCharts := []*ApplicationChart{}
	err := adapter.engine.Desc("created_time").Find(&ApplicationCharts, &ApplicationChart{Owner: owner})
	if err != nil {
		return ApplicationCharts, err
	}
	return ApplicationCharts, nil
}

// GetPaginationApplicationCharts retrieves a paginated list of application charts for a given owner
func GetPaginationApplicationCharts(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*ApplicationChart, error) {
	ApplicationCharts := []*ApplicationChart{}
	session := GetDbSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&ApplicationCharts)
	if err != nil {
		return ApplicationCharts, err
	}

	return ApplicationCharts, nil
}

// UpdateApplicationChart updates an existing application chart
func UpdateApplicationChart(id string, applicationChart *ApplicationChart) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	applicationChart.UpdatedTime = util.GetCurrentTime()
	if app, err := getApplicationChart(owner, name); err != nil {
		return false, err
	} else if app == nil {
		return false, fmt.Errorf("application chart not found: %s/%s", owner, name)
	}

	affected, err := adapter.engine.ID(core.PK{owner, name}).AllCols().Update(applicationChart)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

// AddApplicationChart adds a new application chart
func AddApplicationChart(applicationChart *ApplicationChart) (bool, error) {
	if applicationChart.CreatedTime == "" {
		applicationChart.CreatedTime = util.GetCurrentTime()
	}
	if applicationChart.UpdatedTime == "" {
		applicationChart.UpdatedTime = util.GetCurrentTime()
	}

	// Generate namespace name based on ApplicationChart owner and name
	applicationChart.Namespace = fmt.Sprintf(NamespaceFormat, strings.ReplaceAll(applicationChart.Name, "_", "-"))

	// Set initial status
	if applicationChart.Status == "" {
		applicationChart.Status = StatusNotDeployed
	}

	affected, err := adapter.engine.Insert(applicationChart)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteApplicationChart(applicationChart *ApplicationChart) (bool, error) {
	owner, name, namespace := applicationChart.Owner, applicationChart.Name, applicationChart.Namespace
	// Get the application chart
	chart, err := getApplicationChart(owner, name)
	if err != nil {
		return false, err
	}
	if chart == nil {
		return false, nil
	}

	// If the chart exists, delete the deployment
	if chart.Status != "Not Deployed" {
		go func() {
			_, err := UndeployApplication(owner, name, namespace)
			if err != nil {
				return
			}
		}()
	}

	// Then delete the ApplicationChart record
	affected, err := adapter.engine.ID(core.PK{owner, name}).Delete(chart)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

// GetApplicationChartsFromRepo loads application data from a Helm chart repository's index.yaml
func GetApplicationChartsFromRepo(owner, repoUrl string) ([]*ApplicationChart, error) {
	// Fetch helm index
	helmIndex, err := application.GetHelmIndexFromUrl(repoUrl)
	if err != nil {
		return nil, err
	}

	// Convert Helm chart entries to ApplicationChart objects
	var applicationCharts []*ApplicationChart
	currentTime := util.GetCurrentTime()

	for chartName, chartVersions := range helmIndex.Entries {
		// Current use the latest version (first entry) for each chart
		if len(chartVersions) > 0 {
			latestChart := chartVersions[0]
			if latestChart == nil {
				continue
			}

			// Convert maintainers to JSON string
			var maintainersJson string
			if len(latestChart.Maintainers) > 0 {
				if maintainers, _ := json.Marshal(latestChart.Maintainers); maintainers != nil {
					maintainersJson = string(maintainers)
				}
			}

			// Convert sources to JSON string
			var sourcesJson string
			if len(latestChart.Sources) > 0 {
				if sources, _ := json.Marshal(latestChart.Sources); sources != nil {
					sourcesJson = string(sources)
				}
			}

			// Convert keywords to comma-separated string
			var keywordsStr string
			if len(latestChart.Keywords) > 0 {
				keywordsStr = strings.Join(latestChart.Keywords, ",")
			}

			// Select first URLs as chart URL
			chartUrl := ""
			if len(latestChart.URLs) > 0 {
				chartUrl = latestChart.URLs[0]
			}

			applicationChart := &ApplicationChart{
				Owner:         owner,
				Name:          chartName,
				CreatedTime:   currentTime,
				UpdatedTime:   currentTime,
				DisplayName:   latestChart.Name,
				Description:   latestChart.Description,
				Status:        StatusNotDeployed,
				Namespace:     fmt.Sprintf(NamespaceFormat, strings.ReplaceAll(chartName, "_", "-")),
				Version:       latestChart.Version,
				AppVersion:    latestChart.AppVersion,
				RepositoryUrl: repoUrl,
				ChartUrl:      chartUrl,
				IconUrl:       latestChart.Icon,
				Keywords:      keywordsStr,
				Home:          latestChart.Home,
				Sources:       sourcesJson,
				Maintainers:   maintainersJson,
				Type:          latestChart.Type,
				ApiVersion:    latestChart.APIVersion,
			}

			applicationCharts = append(applicationCharts, applicationChart)
		}
	}

	return applicationCharts, nil
}

// AddApplicationChartsFromRepo loads applications from a repository and saves them to database
func AddApplicationChartsFromRepo(owner, repoUrl string) error {
	applicationCharts, err := GetApplicationChartsFromRepo(owner, repoUrl)
	if err != nil {
		return err
	}

	for _, appChart := range applicationCharts {
		// Check if application already exists
		existingApp, err := getApplicationChart(owner, appChart.Name)
		if err != nil {
			return fmt.Errorf("failed to check existing application %s: %v", appChart.Name, err)
		}

		if existingApp != nil {
			// Update existing application with new data from repository
			appChart.CreatedTime = existingApp.CreatedTime // Preserve original creation time
			_, err = UpdateApplicationChart(fmt.Sprintf("%s/%s", owner, appChart.Name), appChart)
			if err != nil {
				return fmt.Errorf("failed to update application %s: %v", appChart.Name, err)
			}
		} else {
			// Add new application
			_, err = AddApplicationChart(appChart)
			if err != nil {
				return fmt.Errorf("failed to add application %s: %v", appChart.Name, err)
			}
		}
	}

	return nil
}

// GetApplicationChartContentFromUrl retrieves the content of a Helm chart from a URL
func GetApplicationChartContentFromUrl(chartUrl string) (*chart.Chart, error) {
	return application.GetChartContentFromUrl(chartUrl)
}

// GetApplicationChartContent retrieves the content of an application chart
func GetApplicationChartContent(owner, name string) (*ChartContent, error) {
	applicationChart, err := getApplicationChart(owner, name)
	if err != nil {
		return nil, fmt.Errorf("failed to get application chart: %v", err)
	}

	if applicationChart == nil {
		return nil, fmt.Errorf("application chart not found: %s/%s", owner, name)
	}

	if applicationChart.ChartUrl == "" {
		return nil, fmt.Errorf("chart URL not specified for application: %s/%s", owner, name)
	}

	chart, err := GetApplicationChartContentFromUrl(applicationChart.ChartUrl)
	if err != nil {
		return nil, err
	}

	return &ChartContent{
		ApplicationChart: applicationChart,
		Chart:            chart,
	}, nil
}

// GetKubernetesCapabilities retrieves the Kubernetes cluster capabilities
func GetKubernetesCapabilities() *chartutil.Capabilities {
	capabilities := chartutil.DefaultCapabilities
	if k8sClient == nil {
		return capabilities
	}

	sv, err := k8sClient.clientSet.Discovery().ServerVersion()
	if err != nil {
		return capabilities
	}

	apiGroupList, err := k8sClient.clientSet.Discovery().ServerGroups()
	if err != nil {
		return capabilities
	}

	versions := chartutil.VersionSet{}
	for _, group := range apiGroupList.Groups {
		for _, version := range group.Versions {
			versions = append(versions, group.Name+"/"+version.Version)
		}
	}

	capabilities = &chartutil.Capabilities{
		KubeVersion: chartutil.KubeVersion{
			Version: sv.String(),
			Major:   sv.Major,
			Minor:   sv.Minor,
		},
		APIVersions: versions,
		HelmVersion: chartutil.DefaultCapabilities.HelmVersion,
	}

	return capabilities
}

// ReleaseApplicationChart renders an application chart with custom values
func ReleaseApplicationChart(owner, name string, options *ChartReleaseOptions) (*application.RenderedChart, error) {
	app, err := getApplicationChart(owner, name)
	if err != nil {
		return nil, fmt.Errorf("failed to get application chart: %v", err)
	}
	if app == nil {
		return nil, fmt.Errorf("application chart not found: %s/%s", owner, name)
	}

	if app.ChartUrl == "" {
		return nil, fmt.Errorf("chart URL not specified for application: %s/%s", owner, name)
	}

	// Get the chart content from the URL
	// Current json Marshaling chart when GetApplicationChartContent have limited fields,
	// so we need to load the full chart
	options.Chart, err = application.GetChartContentFromUrl(app.ChartUrl)
	if err != nil {
		return nil, fmt.Errorf("failed to get chart content: %v", err)
	}

	if options == nil {
		options = &ChartReleaseOptions{}
	}

	// Set default values
	if options.Name == "" {
		options.Name = app.Name
	}
	if options.Namespace == "" {
		options.Namespace = app.Namespace
	}

	capabilities := GetKubernetesCapabilities()

	// Convert to application layer render options
	renderOptions := &application.ReleaseOptions{
		Values:         options.Values,
		Capabilities:   capabilities,
		ReleaseOptions: options.ReleaseOptions,
	}

	return application.GetRenderChart(options.Chart, renderOptions)
}
