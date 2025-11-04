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

package util

import "testing"

func TestIsLocalhostTarget(t *testing.T) {
	tests := []struct {
		name     string
		target   string
		expected bool
	}{
		{"localhost string", "localhost", true},
		{"IPv4 loopback", "127.0.0.1", true},
		{"IPv4 loopback range", "127.0.0.2", true},
		{"IPv6 loopback", "::1", true},
		{"Regular hostname", "myserver", false},
		{"Regular IP", "192.168.1.1", false},
		{"Public IP", "8.8.8.8", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsLocalhostTarget(tt.target)
			if result != tt.expected {
				t.Errorf("IsLocalhostTarget(%s) = %v, expected %v", tt.target, result, tt.expected)
			}
		})
	}
}

func TestIsIPAddress(t *testing.T) {
	tests := []struct {
		name     string
		target   string
		expected bool
	}{
		{"IPv4 address", "192.168.1.1", true},
		{"IPv6 address", "2001:db8::1", true},
		{"Loopback IPv4", "127.0.0.1", true},
		{"Loopback IPv6", "::1", true},
		{"Hostname", "myserver", false},
		{"Localhost", "localhost", false},
		{"FQDN", "server.example.com", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsIPAddress(tt.target)
			if result != tt.expected {
				t.Errorf("IsIPAddress(%s) = %v, expected %v", tt.target, result, tt.expected)
			}
		})
	}
}

func TestGetLocalIPAddresses(t *testing.T) {
	ips, err := GetLocalIPAddresses()
	if err != nil {
		t.Fatalf("GetLocalIPAddresses() returned error: %v", err)
	}

	// We should have at least one IP address (might have more depending on the system)
	// Even if we only have loopback, the function should not return loopback IPs
	// So it's OK if we get 0 IPs on a system with only loopback configured
	t.Logf("Found %d local IP addresses: %v", len(ips), ips)

	// Verify that none of the returned IPs are loopback
	for _, ip := range ips {
		if IsLocalhostTarget(ip) {
			t.Errorf("GetLocalIPAddresses() returned loopback IP: %s", ip)
		}
	}
}

func TestMatchTargetWithMachine(t *testing.T) {
	// Get actual local IPs for testing
	localIPs, _ := GetLocalIPAddresses()
	
	tests := []struct {
		name        string
		target      string
		hostname    string
		shouldMatch bool
	}{
		{"Localhost string", "localhost", "anyhost", true},
		{"IPv4 loopback", "127.0.0.1", "anyhost", true},
		{"IPv6 loopback", "::1", "anyhost", true},
		{"Matching hostname", "myserver", "myserver", true},
		{"Matching hostname case insensitive", "MyServer", "myserver", true},
		{"Non-matching hostname", "otherserver", "myserver", false},
	}

	// Add test for local IP if we have one
	if len(localIPs) > 0 {
		tests = append(tests, struct {
			name        string
			target      string
			hostname    string
			shouldMatch bool
		}{"Local IP", localIPs[0], "anyhost", true})
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			match, err := MatchTargetWithMachine(tt.target, tt.hostname)
			if err != nil {
				t.Errorf("MatchTargetWithMachine(%s, %s) returned error: %v", tt.target, tt.hostname, err)
				return
			}
			if match != tt.shouldMatch {
				t.Errorf("MatchTargetWithMachine(%s, %s) = %v, expected %v", tt.target, tt.hostname, match, tt.shouldMatch)
			}
		})
	}
}
