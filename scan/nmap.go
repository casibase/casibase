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
	"fmt"
	"os/exec"
	"strings"
)

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

func (p *NmapScanProvider) Scan(target string) (string, error) {
	// Use default command for backward compatibility
	return p.ScanWithCommand(target, "-sn %s")
}

func (p *NmapScanProvider) ScanWithCommand(target string, command string) (string, error) {
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

	// Replace %s with target, or append target if no %s placeholder
	var args []string
	if strings.Contains(command, "%s") {
		// Split command and replace %s with target
		cmdStr := fmt.Sprintf(command, target)
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
