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
	"encoding/json"
	"strings"
	"testing"
)

func TestParseNmapOutput(t *testing.T) {
	provider := &NmapScanProvider{}

	// Sample nmap output
	nmapOutput := `Starting Nmap 7.80 at 2025-01-15 10:30:00
Nmap scan report for localhost (127.0.0.1)
Host is up (0.00010s latency)
Not shown: 997 closed ports
PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
443/tcp  open  https

Nmap scan report for 192.168.1.1
Host is up (0.0010s latency)
MAC Address: AA:BB:CC:DD:EE:FF (Vendor Name)
Not shown: 998 closed ports
PORT     STATE SERVICE VERSION
53/tcp   open  domain  ISC BIND 9.11.3
8080/tcp open  http    Apache httpd 2.4.41

Nmap done: 2 hosts scanned at 2025-01-15 10:30:05`

	result := provider.parseNmapOutput(nmapOutput, "-sV 127.0.0.1 192.168.1.1")

	// Test that result is valid
	if result == nil {
		t.Fatal("Expected non-nil result")
	}

	// Test command
	if result.Command != "-sV 127.0.0.1 192.168.1.1" {
		t.Errorf("Expected command '-sV 127.0.0.1 192.168.1.1', got '%s'", result.Command)
	}

	// Test hosts count
	if len(result.Hosts) != 2 {
		t.Errorf("Expected 2 hosts, got %d", len(result.Hosts))
	}

	// Test first host
	if len(result.Hosts) > 0 {
		host1 := result.Hosts[0]
		if host1.IP != "127.0.0.1" {
			t.Errorf("Expected IP 127.0.0.1, got %s", host1.IP)
		}
		if host1.Hostname != "localhost" {
			t.Errorf("Expected hostname localhost, got %s", host1.Hostname)
		}
		if host1.Status != "up" {
			t.Errorf("Expected status up, got %s", host1.Status)
		}
		if len(host1.Ports) != 3 {
			t.Errorf("Expected 3 ports for host1, got %d", len(host1.Ports))
		}
	}

	// Test second host
	if len(result.Hosts) > 1 {
		host2 := result.Hosts[1]
		if host2.IP != "192.168.1.1" {
			t.Errorf("Expected IP 192.168.1.1, got %s", host2.IP)
		}
		if host2.MACAddr != "AA:BB:CC:DD:EE:FF" {
			t.Errorf("Expected MAC AA:BB:CC:DD:EE:FF, got %s", host2.MACAddr)
		}
		if host2.Vendor != "Vendor Name" {
			t.Errorf("Expected vendor 'Vendor Name', got %s", host2.Vendor)
		}
		if len(host2.Ports) != 2 {
			t.Errorf("Expected 2 ports for host2, got %d", len(host2.Ports))
		}
	}

	// Test JSON marshaling
	jsonBytes, err := json.Marshal(result)
	if err != nil {
		t.Fatalf("Failed to marshal result to JSON: %v", err)
	}

	jsonStr := string(jsonBytes)
	if !strings.Contains(jsonStr, "127.0.0.1") {
		t.Error("JSON output should contain 127.0.0.1")
	}
}

func TestParseNmapOutputNoHosts(t *testing.T) {
	provider := &NmapScanProvider{}

	// Nmap output with no hosts found
	nmapOutput := `Starting Nmap 7.80 at 2025-01-15 10:30:00
Note: Host seems down. If it is really up, but blocking our ping probes, try -Pn
Nmap done: 1 IP address (0 hosts up) scanned in 3.50 seconds`

	result := provider.parseNmapOutput(nmapOutput, "-sn 192.168.1.254")

	if result == nil {
		t.Fatal("Expected non-nil result")
	}

	if len(result.Hosts) != 0 {
		t.Errorf("Expected 0 hosts, got %d", len(result.Hosts))
	}

	if result.Summary == "" {
		t.Error("Expected summary to be set")
	}
}

func TestParseNmapOutputPingScan(t *testing.T) {
	provider := &NmapScanProvider{}

	// Ping scan output (no port info)
	nmapOutput := `Starting Nmap 7.80 at 2025-01-15 10:30:00
Nmap scan report for 192.168.1.10
Host is up (0.0020s latency)

Nmap done: 1 IP address (1 host up) scanned in 0.50 seconds`

	result := provider.parseNmapOutput(nmapOutput, "-sn 192.168.1.10")

	if result == nil {
		t.Fatal("Expected non-nil result")
	}

	if len(result.Hosts) != 1 {
		t.Errorf("Expected 1 host, got %d", len(result.Hosts))
	}

	if len(result.Hosts) > 0 {
		host := result.Hosts[0]
		if host.IP != "192.168.1.10" {
			t.Errorf("Expected IP 192.168.1.10, got %s", host.IP)
		}
		if host.Status != "up" {
			t.Errorf("Expected status up, got %s", host.Status)
		}
		if host.Latency != "0.0020s" {
			t.Errorf("Expected latency 0.0020s, got %s", host.Latency)
		}
	}
}
