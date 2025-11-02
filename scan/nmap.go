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
	"regexp"
	"strings"
)

// NmapHost represents a scanned host
type NmapHost struct {
	IP       string     `json:"ip"`
	Hostname string     `json:"hostname,omitempty"`
	Status   string     `json:"status"`
	Ports    []NmapPort `json:"ports,omitempty"`
	OS       string     `json:"os,omitempty"`
	MACAddr  string     `json:"macAddr,omitempty"`
	Vendor   string     `json:"vendor,omitempty"`
	Latency  string     `json:"latency,omitempty"`
}

// NmapPort represents a scanned port
type NmapPort struct {
	Port    string `json:"port"`
	State   string `json:"state"`
	Service string `json:"service,omitempty"`
	Version string `json:"version,omitempty"`
}

// NmapScanResult represents the complete scan result
type NmapScanResult struct {
	StartTime string     `json:"startTime,omitempty"`
	EndTime   string     `json:"endTime,omitempty"`
	Hosts     []NmapHost `json:"hosts"`
	Summary   string     `json:"summary"`
}

type NmapScanProvider struct {
	nmapPath string
}

func NewNmapScanProvider(clientId string) (*NmapScanProvider, error) {
	provider := &NmapScanProvider{
		nmapPath: clientId,
	}

	// If clientId is empty, try to find nmap in system PATH
	if provider.nmapPath == "" {
		nmapPath, err := exec.LookPath("nmap")
		if err != nil {
			return nil, fmt.Errorf("nmap not found in system PATH, please specify the path to nmap binary")
		}
		provider.nmapPath = nmapPath
	}

	return provider, nil
}

func (p *NmapScanProvider) Scan(target string, command string) (string, error) {
	if target == "" {
		return "", fmt.Errorf("scan target cannot be empty")
	}

	// Validate target to prevent command injection
	target = strings.TrimSpace(target)
	if strings.ContainsAny(target, ";&|`$") {
		return "", fmt.Errorf("invalid characters in scan target")
	}

	// Use default command if empty
	if command == "" {
		command = "-sn %s"
	}

	// Validate command to prevent command injection
	command = strings.TrimSpace(command)
	if strings.ContainsAny(command, ";&|`$") {
		return "", fmt.Errorf("invalid characters in scan command")
	}

	// Replace %s with target, or append target if no %s placeholder
	var args []string
	if strings.Contains(command, "%s") {
		// Replace %s with target using strings.Replace for safety
		cmdStr := strings.Replace(command, "%s", target, -1)
		args = strings.Fields(cmdStr)
	} else {
		// No %s placeholder, append target at the end
		args = strings.Fields(command)
		args = append(args, target)
	}

	// Run nmap with custom command options
	cmd := exec.Command(p.nmapPath, args...)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("nmap scan failed: %v, stderr: %s", err, stderr.String())
	}

	result := stdout.String()
	if result == "" {
		result = "Scan completed with no output"
	}

	return result, nil
}

func (p *NmapScanProvider) ParseResult(rawResult string) (string, error) {
	// Parse the raw output into structured data
	parsedResult := p.parseNmapOutput(rawResult)

	// Convert to JSON
	jsonBytes, err := json.Marshal(parsedResult)
	if err != nil {
		return "", fmt.Errorf("failed to marshal nmap result: %v", err)
	}

	return string(jsonBytes), nil
}

// parseNmapOutput parses the text output from nmap and creates a structured result
func (p *NmapScanProvider) parseNmapOutput(output string) *NmapScanResult {
	result := &NmapScanResult{
		Hosts: []NmapHost{},
	}

	lines := strings.Split(output, "\n")
	var currentHost *NmapHost

	// Regex patterns for parsing
	ipPattern := regexp.MustCompile(`Nmap scan report for (?:([^\s]+) \()?(\d+\.\d+\.\d+\.\d+)\)?`)
	hostUpPattern := regexp.MustCompile(`Host is (up|down)`)
	latencyPattern := regexp.MustCompile(`\(([0-9.]+s) latency\)`)
	macPattern := regexp.MustCompile(`MAC Address: ([0-9A-F:]+) \(([^)]+)\)`)
	portPattern := regexp.MustCompile(`^(\d+)/(\w+)\s+(\w+)\s+(\S+)(?:\s+(.+))?`)
	osPattern := regexp.MustCompile(`OS: (.+)`)
	startTimePattern := regexp.MustCompile(`Starting Nmap .+ at (.+)`)
	endTimePattern := regexp.MustCompile(`Nmap done: .+ at (.+)`)
	summaryPattern := regexp.MustCompile(`Nmap done: (.+)`)

	for _, line := range lines {
		line = strings.TrimSpace(line)

		// Parse start time
		if matches := startTimePattern.FindStringSubmatch(line); len(matches) > 1 {
			result.StartTime = matches[1]
		}

		// Parse end time and summary
		if matches := endTimePattern.FindStringSubmatch(line); len(matches) > 1 {
			result.EndTime = matches[1]
		}
		if matches := summaryPattern.FindStringSubmatch(line); len(matches) > 1 {
			result.Summary = matches[1]
		}

		// Parse host header
		if matches := ipPattern.FindStringSubmatch(line); len(matches) > 0 {
			// Save previous host if exists
			if currentHost != nil {
				result.Hosts = append(result.Hosts, *currentHost)
			}

			currentHost = &NmapHost{
				IP:    matches[2],
				Ports: []NmapPort{},
			}
			if matches[1] != "" {
				currentHost.Hostname = matches[1]
			}
		}

		// Parse host status
		if currentHost != nil {
			if matches := hostUpPattern.FindStringSubmatch(line); len(matches) > 1 {
				currentHost.Status = matches[1]
			}

			// Parse latency
			if matches := latencyPattern.FindStringSubmatch(line); len(matches) > 1 {
				currentHost.Latency = matches[1]
			}

			// Parse MAC address
			if matches := macPattern.FindStringSubmatch(line); len(matches) > 2 {
				currentHost.MACAddr = matches[1]
				currentHost.Vendor = matches[2]
			}

			// Parse OS
			if matches := osPattern.FindStringSubmatch(line); len(matches) > 1 {
				currentHost.OS = matches[1]
			}

			// Parse port information
			if matches := portPattern.FindStringSubmatch(line); len(matches) > 3 {
				port := NmapPort{
					Port:    matches[1] + "/" + matches[2],
					State:   matches[3],
					Service: matches[4],
				}
				if len(matches) > 5 && matches[5] != "" {
					port.Version = matches[5]
				}
				currentHost.Ports = append(currentHost.Ports, port)
			}
		}
	}

	// Add the last host
	if currentHost != nil {
		result.Hosts = append(result.Hosts, *currentHost)
	}

	// If no summary was found, create a simple one
	if result.Summary == "" {
		result.Summary = fmt.Sprintf("%d host(s) scanned", len(result.Hosts))
	}

	return result
}
