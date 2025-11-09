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
	"context"
	"encoding/json"
	"fmt"

	"github.com/Azure/azure-sdk-for-go/sdk/azidentity"
	"github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armresources"
	"github.com/casibase/casibase/util"
)

// AzureCloudParser implements CloudParser for Azure
type AzureCloudParser struct{}

// ScanAssets scans all resources from Azure
func (p *AzureCloudParser) ScanAssets(owner string, provider *Provider) ([]*Asset, error) {
	client, err := p.createClient(provider)
	if err != nil {
		return nil, err
	}

	ctx := context.Background()
	var assets []*Asset

	// List all resources in the subscription
	pager := client.NewListPager(nil)
	for pager.More() {
		page, err := pager.NextPage(ctx)
		if err != nil {
			return nil, err
		}

		for _, resource := range page.Value {
			asset := p.convertResourceToAsset(owner, provider, resource)
			assets = append(assets, asset)
		}
	}

	return assets, nil
}

// createClient creates an Azure Resource Graph client
func (p *AzureCloudParser) createClient(provider *Provider) (*armresources.Client, error) {
	// ClientId is the subscription ID for Azure
	subscriptionID := provider.ClientId

	// ClientSecret contains the authentication credentials in JSON format
	// Expected format: {"tenantId": "xxx", "clientId": "xxx", "clientSecret": "xxx"}
	var credentials map[string]string
	if err := json.Unmarshal([]byte(provider.ClientSecret), &credentials); err != nil {
		return nil, fmt.Errorf("failed to parse Azure credentials: %v", err)
	}

	tenantID, ok := credentials["tenantId"]
	if !ok {
		return nil, fmt.Errorf("tenantId not found in credentials")
	}

	clientID, ok := credentials["clientId"]
	if !ok {
		return nil, fmt.Errorf("clientId not found in credentials")
	}

	clientSecret, ok := credentials["clientSecret"]
	if !ok {
		return nil, fmt.Errorf("clientSecret not found in credentials")
	}

	// Create a credential object
	cred, err := azidentity.NewClientSecretCredential(tenantID, clientID, clientSecret, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create Azure credential: %v", err)
	}

	// Create the resources client
	client, err := armresources.NewClient(subscriptionID, cred, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create Azure resources client: %v", err)
	}

	return client, nil
}

// convertResourceToAsset converts an Azure resource to an Asset
func (p *AzureCloudParser) convertResourceToAsset(owner string, provider *Provider, resource *armresources.GenericResourceExpanded) *Asset {
	// Extract resource information
	resourceID := ""
	if resource.ID != nil {
		resourceID = *resource.ID
	}

	resourceName := ""
	if resource.Name != nil {
		resourceName = *resource.Name
	}

	resourceType := ""
	if resource.Type != nil {
		resourceType = *resource.Type
	}

	location := ""
	if resource.Location != nil {
		location = *resource.Location
	}

	// Build properties map with available information
	properties := map[string]interface{}{
		"resourceType": resourceType,
	}

	// Add resource-specific properties if available
	if resource.Kind != nil {
		properties["kind"] = *resource.Kind
	}
	if resource.ManagedBy != nil {
		properties["managedBy"] = *resource.ManagedBy
	}
	if resource.SKU != nil {
		properties["sku"] = map[string]interface{}{
			"name": resource.SKU.Name,
			"tier": resource.SKU.Tier,
		}
	}

	propertiesJson, err := json.Marshal(properties)
	if err != nil {
		propertiesJson = []byte("{}")
	}

	// Extract tags
	tag := ""
	if resource.Tags != nil {
		for key, value := range resource.Tags {
			if value != nil {
				tag += fmt.Sprintf("%s=%s,", key, *value)
			}
		}
	}

	// Convert resource type to display name
	displayResourceType := p.getDisplayResourceType(resourceType)

	asset := &Asset{
		Owner:       owner,
		Name:        util.GenerateId(),
		CreatedTime: util.GetCurrentTime(),
		UpdatedTime: util.GetCurrentTime(),
		DisplayName: resourceName,
		Provider:    provider.Name,
		Id:          resourceID,
		Type:        displayResourceType,
		Region:      location,
		Zone:        "",
		State:       "",
		Tag:         tag,
		Properties:  string(propertiesJson),
	}

	return asset
}

// getDisplayResourceType converts an Azure resource type to a cloud-neutral display name
func (p *AzureCloudParser) getDisplayResourceType(resourceType string) string {
	// Map of known resource types to cloud-neutral display names
	displayNames := map[string]string{
		"Microsoft.Compute/virtualMachines":                "Virtual Machine",
		"Microsoft.Compute/disks":                          "Disk",
		"Microsoft.Compute/snapshots":                      "Snapshot",
		"Microsoft.Compute/images":                         "Image",
		"Microsoft.Compute/availabilitySets":               "Availability Set",
		"Microsoft.Compute/virtualMachineScaleSets":        "VM Scale Set",
		"Microsoft.Network/virtualNetworks":                "VPC",
		"Microsoft.Network/networkInterfaces":              "Network Interface",
		"Microsoft.Network/networkSecurityGroups":          "Security Group",
		"Microsoft.Network/publicIPAddresses":              "Elastic IP",
		"Microsoft.Network/loadBalancers":                  "Load Balancer",
		"Microsoft.Network/applicationGateways":            "Application Gateway",
		"Microsoft.Network/vpnGateways":                    "VPN Gateway",
		"Microsoft.Network/virtualNetworkGateways":         "Virtual Network Gateway",
		"Microsoft.Network/localNetworkGateways":           "Local Network Gateway",
		"Microsoft.Network/routeTables":                    "Route Table",
		"Microsoft.Network/natGateways":                    "NAT Gateway",
		"Microsoft.Storage/storageAccounts":                "Storage Account",
		"Microsoft.Sql/servers":                            "SQL Server",
		"Microsoft.Sql/servers/databases":                  "SQL Database",
		"Microsoft.DBforPostgreSQL/servers":                "PostgreSQL Server",
		"Microsoft.DBforMySQL/servers":                     "MySQL Server",
		"Microsoft.Cache/Redis":                            "Redis Cache",
		"Microsoft.DocumentDB/databaseAccounts":            "Cosmos DB",
		"Microsoft.ContainerService/managedClusters":       "AKS Cluster",
		"Microsoft.ContainerInstance/containerGroups":      "Container Instance",
		"Microsoft.Web/sites":                              "App Service",
		"Microsoft.Web/serverFarms":                        "App Service Plan",
		"Microsoft.KeyVault/vaults":                        "Key Vault",
		"Microsoft.Cdn/profiles":                           "CDN Profile",
		"Microsoft.Cdn/profiles/endpoints":                 "CDN Endpoint",
		"Microsoft.OperationalInsights/workspaces":         "Log Analytics Workspace",
		"Microsoft.ManagedIdentity/userAssignedIdentities": "Managed Identity",
	}

	if displayName, ok := displayNames[resourceType]; ok {
		return displayName
	}

	// If no mapping found, return the resource type as-is
	return resourceType
}
