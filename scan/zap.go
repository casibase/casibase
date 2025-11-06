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

package scan

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os/exec"
	"strings"
)

// ZapAlert represents a single alert/vulnerability found by ZAP
type ZapAlert struct {
	PluginID    string `json:"pluginid"`
	AlertRef    string `json:"alertRef"`
	Alert       string `json:"alert"`
	Name        string `json:"name"`
	RiskCode    string `json:"riskcode"`
	Confidence  string `json:"confidence"`
	RiskDesc    string `json:"riskdesc"`
	Description string `json:"desc"`
	Instances   []struct {
		URI    string `json:"uri"`
		Method string `json:"method"`
		Param  string `json:"param"`
		Attack string `json:"attack"`
		Evidence string `json:"evidence"`
	} `json:"instances"`
	Count      string   `json:"count"`
	Solution   string   `json:"solution"`
	Reference  string   `json:"reference"`
	CweID      string   `json:"cweid"`
	WascID     string   `json:"wascid"`
	SourceID   string   `json:"sourceid"`
}

// ZapSite represents a scanned site
type ZapSite struct {
	Name   string     `json:"@name"`
	Host   string     `json:"@host"`
	Port   string     `json:"@port"`
	SSL    string     `json:"@ssl"`
	Alerts []ZapAlert `json:"alerts"`
}

// ZapScanResult represents the complete ZAP scan result
type ZapScanResult struct {
	Sites   []ZapSite  `json:"sites"`
	Summary ZapSummary `json:"summary"`
}

// ZapSummary provides a summary of the scan results
type ZapSummary struct {
	TotalAlerts int            `json:"totalAlerts"`
	ByRisk      map[string]int `json:"byRisk"`
	ByConfidence map[string]int `json:"byConfidence"`
}

type ZapScanProvider struct {
	zapPath string
}

// IsZapAvailable checks if ZAP is available in the system
// Returns true if ZAP is available (either through clientId path or system PATH)
func IsZapAvailable(clientId string) bool {
	// If clientId is provided, validate the path exists and is executable
	if clientId != "" {
		// Try to run zap with -version or -cmd to verify it's executable
		cmd := exec.Command(clientId, "-version")
		err := cmd.Run()
		if err == nil {
			return true
		}
		// Try alternative version check
		cmd = exec.Command(clientId, "-cmd")
		err = cmd.Run()
		return err == nil
	}

	// Check common ZAP command names in system PATH
	zapCommands := []string{"zap.sh", "zap-cli", "zap", "zap.bat"}
	for _, zapCmd := range zapCommands {
		_, err := exec.LookPath(zapCmd)
		if err == nil {
			return true
		}
	}
	return false
}

func NewZapScanProvider(clientId string) (*ZapScanProvider, error) {
	provider := &ZapScanProvider{
		zapPath: clientId,
	}

	// If clientId is empty, try to find ZAP in system PATH
	if provider.zapPath == "" {
		// Try common ZAP command names
		zapCommands := []string{"zap.sh", "zap-cli", "zap", "zap.bat"}
		for _, zapCmd := range zapCommands {
			zapPath, err := exec.LookPath(zapCmd)
			if err == nil {
				provider.zapPath = zapPath
				break
			}
		}

		if provider.zapPath == "" {
			return nil, fmt.Errorf("%s ZAP not found in system PATH, please specify the path to ZAP binary (zap.sh, zap-cli, etc.)", getHostnamePrefix())
		}
	}

	return provider, nil
}

func (p *ZapScanProvider) Scan(target string, command string) (string, error) {
	if target == "" {
		return "", fmt.Errorf("%s scan target cannot be empty", getHostnamePrefix())
	}

	// Validate target to prevent command injection
	target = strings.TrimSpace(target)
	if strings.ContainsAny(target, ";&|`$") {
		return "", fmt.Errorf("%s invalid characters in scan target", getHostnamePrefix())
	}

	// Use default command if empty
	// ZAP quick scan with JSON output
	if command == "" {
		command = "-cmd -quickurl %s -quickout /dev/stdout -quickprogress"
	}

	// Validate command to prevent command injection
	command = strings.TrimSpace(command)
	if strings.ContainsAny(command, ";&|`") {
		return "", fmt.Errorf("%s invalid characters in scan command", getHostnamePrefix())
	}

	// Replace %s with target, or append target if no %s placeholder
	var args []string
	if strings.Contains(command, "%s") {
		// Replace %s with target
		cmdStr := strings.Replace(command, "%s", target, -1)
		args = strings.Fields(cmdStr)
	} else {
		// No %s placeholder, append target
		args = strings.Fields(command)
		args = append(args, target)
	}

	// Run ZAP with custom command options
	cmd := exec.Command(p.zapPath, args...)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	fmt.Printf("%s [ZAP] Executing ZAP scan: %s %s\n", getHostnamePrefix(), p.zapPath, strings.Join(args, " "))
	err := cmd.Run()
	if err != nil {
		// ZAP may return non-zero exit code even when scan completes successfully
		// Check if we got any output
		if stdout.Len() == 0 {
			return "", fmt.Errorf("%s ZAP scan failed: %v, stderr: %s", getHostnamePrefix(), err, stderr.String())
		}
		// Log the error but continue with parsing
		fmt.Printf("%s [ZAP] Scan completed with warnings: %v\n", getHostnamePrefix(), err)
	}
	fmt.Printf("%s [ZAP] Scan completed successfully\n", getHostnamePrefix())

	result := stdout.String()
	if result == "" {
		result = "Scan completed with no alerts found"
	}

	return result, nil
}

func (p *ZapScanProvider) ParseResult(rawResult string) (string, error) {
	// Parse the XML/JSON output into structured data
	fmt.Printf("%s [ZAP] Parsing scan results\n", getHostnamePrefix())

	if rawResult == "" || rawResult == "Scan completed with no alerts found" {
		emptyResult := &ZapScanResult{
			Sites: []ZapSite{},
			Summary: ZapSummary{
				TotalAlerts:  0,
				ByRisk:       map[string]int{},
				ByConfidence: map[string]int{},
			},
		}
		jsonBytes, err := json.Marshal(emptyResult)
		if err != nil {
			return "", fmt.Errorf("%s failed to marshal empty ZAP result: %v", getHostnamePrefix(), err)
		}
		return string(jsonBytes), nil
	}

	parsedResult := p.parseZapOutput(rawResult)

	// Convert to JSON
	jsonBytes, err := json.Marshal(parsedResult)
	if err != nil {
		return "", fmt.Errorf("%s failed to marshal ZAP result: %v", getHostnamePrefix(), err)
	}

	alertCount := parsedResult.Summary.TotalAlerts
	alertWord := "alerts"
	if alertCount == 1 {
		alertWord = "alert"
	}
	fmt.Printf("%s [ZAP] Successfully parsed %d %s\n", getHostnamePrefix(), alertCount, alertWord)

	return string(jsonBytes), nil
}

// parseZapOutput parses the JSON/XML output from ZAP and creates a structured result
func (p *ZapScanProvider) parseZapOutput(output string) *ZapScanResult {
	result := &ZapScanResult{
		Sites: []ZapSite{},
		Summary: ZapSummary{
			TotalAlerts:  0,
			ByRisk:       make(map[string]int),
			ByConfidence: make(map[string]int),
		},
	}

	// Try to parse as JSON first
	var zapData map[string]interface{}
	err := json.Unmarshal([]byte(output), &zapData)
	if err != nil {
		// If JSON parsing fails, try to extract structured data from text output
		// For now, return basic result
		fmt.Printf("%s [ZAP] Unable to parse output as JSON, returning raw text: %v\n", getHostnamePrefix(), err)
		return result
	}

	// Check if this is ZAP JSON format (has "site" array)
	if sites, ok := zapData["site"].([]interface{}); ok {
		for _, siteData := range sites {
			site := p.parseSite(siteData)
			result.Sites = append(result.Sites, site)

			// Update summary
			for _, alert := range site.Alerts {
				result.Summary.TotalAlerts++
				
				// Parse risk level from riskdesc (e.g., "High (Warning)")
				riskLevel := p.extractRiskLevel(alert.RiskDesc)
				if riskLevel != "" {
					result.Summary.ByRisk[riskLevel]++
				}
				
				if alert.Confidence != "" {
					result.Summary.ByConfidence[alert.Confidence]++
				}
			}
		}
	}

	return result
}

// parseSite parses a single site from ZAP output
func (p *ZapScanProvider) parseSite(siteData interface{}) ZapSite {
	site := ZapSite{
		Alerts: []ZapAlert{},
	}

	siteMap, ok := siteData.(map[string]interface{})
	if !ok {
		return site
	}

	if name, ok := siteMap["@name"].(string); ok {
		site.Name = name
	}
	if host, ok := siteMap["@host"].(string); ok {
		site.Host = host
	}
	if port, ok := siteMap["@port"].(string); ok {
		site.Port = port
	}
	if ssl, ok := siteMap["@ssl"].(string); ok {
		site.SSL = ssl
	}

	// Parse alerts
	if alerts, ok := siteMap["alerts"].([]interface{}); ok {
		for _, alertData := range alerts {
			alert := p.parseAlert(alertData)
			site.Alerts = append(site.Alerts, alert)
		}
	}

	return site
}

// parseAlert parses a single alert from ZAP output
func (p *ZapScanProvider) parseAlert(alertData interface{}) ZapAlert {
	alert := ZapAlert{}

	alertMap, ok := alertData.(map[string]interface{})
	if !ok {
		return alert
	}

	if pluginID, ok := alertMap["pluginid"].(string); ok {
		alert.PluginID = pluginID
	}
	if alertRef, ok := alertMap["alertRef"].(string); ok {
		alert.AlertRef = alertRef
	}
	if alertName, ok := alertMap["alert"].(string); ok {
		alert.Alert = alertName
		alert.Name = alertName
	}
	if name, ok := alertMap["name"].(string); ok {
		alert.Name = name
	}
	if riskCode, ok := alertMap["riskcode"].(string); ok {
		alert.RiskCode = riskCode
	}
	if confidence, ok := alertMap["confidence"].(string); ok {
		alert.Confidence = confidence
	}
	if riskDesc, ok := alertMap["riskdesc"].(string); ok {
		alert.RiskDesc = riskDesc
	}
	if desc, ok := alertMap["desc"].(string); ok {
		alert.Description = desc
	}
	if count, ok := alertMap["count"].(string); ok {
		alert.Count = count
	}
	if solution, ok := alertMap["solution"].(string); ok {
		alert.Solution = solution
	}
	if reference, ok := alertMap["reference"].(string); ok {
		alert.Reference = reference
	}
	if cweID, ok := alertMap["cweid"].(string); ok {
		alert.CweID = cweID
	}
	if wascID, ok := alertMap["wascid"].(string); ok {
		alert.WascID = wascID
	}
	if sourceID, ok := alertMap["sourceid"].(string); ok {
		alert.SourceID = sourceID
	}

	// Parse instances
	if instances, ok := alertMap["instances"].([]interface{}); ok {
		for _, instData := range instances {
			if instMap, ok := instData.(map[string]interface{}); ok {
				instance := struct {
					URI      string `json:"uri"`
					Method   string `json:"method"`
					Param    string `json:"param"`
					Attack   string `json:"attack"`
					Evidence string `json:"evidence"`
				}{}
				
				if uri, ok := instMap["uri"].(string); ok {
					instance.URI = uri
				}
				if method, ok := instMap["method"].(string); ok {
					instance.Method = method
				}
				if param, ok := instMap["param"].(string); ok {
					instance.Param = param
				}
				if attack, ok := instMap["attack"].(string); ok {
					instance.Attack = attack
				}
				if evidence, ok := instMap["evidence"].(string); ok {
					instance.Evidence = evidence
				}
				
				alert.Instances = append(alert.Instances, instance)
			}
		}
	}

	return alert
}

// extractRiskLevel extracts risk level from riskdesc string (e.g., "High (Warning)" -> "High")
func (p *ZapScanProvider) extractRiskLevel(riskDesc string) string {
	riskDesc = strings.TrimSpace(riskDesc)
	// Common ZAP risk levels: Informational, Low, Medium, High
	// Extract the first word (before space or parenthesis)
	parts := strings.FieldsFunc(riskDesc, func(r rune) bool {
		return r == ' ' || r == '('
	})
	if len(parts) > 0 {
		return parts[0]
	}
	return ""
}

// GetResultSummary generates a short summary of the scan result
func (p *ZapScanProvider) GetResultSummary(result string) string {
	if result == "" {
		return ""
	}

	// Parse the JSON result
	var scanResult ZapScanResult
	err := json.Unmarshal([]byte(result), &scanResult)
	if err != nil {
		// Log the error but return empty string instead of failing
		fmt.Printf("%s [ZAP] Unable to parse scan results for summary: %v\n", getHostnamePrefix(), err)
		return ""
	}

	total := scanResult.Summary.TotalAlerts
	if total == 0 {
		return "No alerts found"
	}

	// Count by risk
	high := scanResult.Summary.ByRisk["High"]
	medium := scanResult.Summary.ByRisk["Medium"]
	low := scanResult.Summary.ByRisk["Low"]
	info := scanResult.Summary.ByRisk["Informational"]

	alertWord := "alerts"
	if total == 1 {
		alertWord = "alert"
	}

	if high > 0 {
		return fmt.Sprintf("%d %s (%d high)", total, alertWord, high)
	} else if medium > 0 {
		return fmt.Sprintf("%d %s (%d medium)", total, alertWord, medium)
	} else if low > 0 {
		return fmt.Sprintf("%d %s (%d low)", total, alertWord, low)
	} else if info > 0 {
		return fmt.Sprintf("%d %s (%d informational)", total, alertWord, info)
	}

	return fmt.Sprintf("%d %s found", total, alertWord)
}
