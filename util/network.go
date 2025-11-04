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

import (
	"net"
	"strings"
)

func IsInternetIp(ip string) bool {
	ipStr, _, err := net.SplitHostPort(ip)
	if err != nil {
		ipStr = ip
	}

	parsedIP := net.ParseIP(ipStr)
	if parsedIP == nil {
		return false
	}

	return !parsedIP.IsPrivate() && !parsedIP.IsLoopback() && !parsedIP.IsMulticast() && !parsedIP.IsUnspecified()
}

// IsLocalhostTarget checks if a target is localhost or a loopback IP (127.0.0.1, ::1, etc.)
func IsLocalhostTarget(target string) bool {
	if target == "localhost" {
		return true
	}

	parsedIP := net.ParseIP(target)
	if parsedIP != nil {
		return parsedIP.IsLoopback()
	}

	return false
}

// IsIPAddress checks if a string is a valid IP address (not a hostname)
func IsIPAddress(target string) bool {
	parsedIP := net.ParseIP(target)
	return parsedIP != nil
}

// GetLocalIPAddresses returns all non-loopback IP addresses of the local machine
// Returns both IPv4 and IPv6 addresses
func GetLocalIPAddresses() ([]string, error) {
	var ips []string

	interfaces, err := net.Interfaces()
	if err != nil {
		return nil, err
	}

	for _, iface := range interfaces {
		// Skip interfaces that are down
		if iface.Flags&net.FlagUp == 0 {
			continue
		}

		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}

		for _, addr := range addrs {
			var ip net.IP
			switch v := addr.(type) {
			case *net.IPNet:
				ip = v.IP
			case *net.IPAddr:
				ip = v.IP
			}

			// Skip loopback addresses
			if ip == nil || ip.IsLoopback() {
				continue
			}

			// Add the IP address
			ips = append(ips, ip.String())
		}
	}

	return ips, nil
}

// MatchTargetWithMachine checks if a scan target matches the current machine
// based on hostname or IP addresses
func MatchTargetWithMachine(target, hostname string) (bool, error) {
	// Check for localhost/loopback targets - always match
	if IsLocalhostTarget(target) {
		return true, nil
	}

	// Check if target is an IP address
	if IsIPAddress(target) {
		// Get local IP addresses
		localIPs, err := GetLocalIPAddresses()
		if err != nil {
			return false, err
		}

		// Check if target IP matches any local IP
		for _, localIP := range localIPs {
			if target == localIP {
				return true, nil
			}
		}
		return false, nil
	}

	// Target is a hostname - compare with machine hostname
	// Case-insensitive comparison for hostname matching
	return strings.EqualFold(target, hostname), nil
}
