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

// CvmInstanceDetail holds detailed information for a CVM instance
type CvmInstanceDetail struct {
	InstanceId         string
	InstanceType       string
	ImageId            string
	OSName             string
	Cpu                int64
	Memory             int64
	PublicIp           string
	PrivateIp          string
	InstanceChargeType string
	Status             string
}

// VpcDetailTencent holds detailed information for a VPC
type VpcDetailTencent struct {
	VpcId       string
	CidrBlock   string
	IsDefault   bool
	Description string
}

// CbsDiskDetail holds detailed information for a CBS disk
type CbsDiskDetail struct {
    DiskId         string
    Size           int64
    Type           string
    Encrypted      bool
    InstanceId     string
    DiskChargeType string
    Status         string
}

// ParseRegions parses provider.Region as comma-separated list, trims spaces.
// Returns default ["ap-guangzhou"] if empty.
func ParseRegions(region string) []string {
    if region == "" {
        return []string{"ap-guangzhou"}
    }
    var res []string
    start := 0
    for i := 0; i < len(region); i++ {
        if region[i] == ',' {
            seg := region[start:i]
            if seg != "" {
                // Trim spaces
                s := seg
                for len(s) > 0 && (s[0] == ' ' || s[0] == '\t') {
                    s = s[1:]
                }
                for len(s) > 0 && (s[len(s)-1] == ' ' || s[len(s)-1] == '\t') {
                    s = s[:len(s)-1]
                }
                if s != "" {
                    res = append(res, s)
                }
            }
            start = i + 1
        }
    }
    seg := region[start:]
    if seg != "" {
        s := seg
        for len(s) > 0 && (s[0] == ' ' || s[0] == '\t') {
            s = s[1:]
        }
        for len(s) > 0 && (s[len(s)-1] == ' ' || s[len(s)-1] == '\t') {
            s = s[:len(s)-1]
        }
        if s != "" {
            res = append(res, s)
        }
    }
    if len(res) == 0 {
        return []string{"ap-guangzhou"}
    }
    return res
}

// InferRegionFromZone tries to map a zone like "ap-guangzhou-1" to "ap-guangzhou".
func InferRegionFromZone(zone string) string {
    if zone == "" {
        return ""
    }
    // Find last '-' and strip trailing segment if it's numeric
    lastDash := -1
    for i := len(zone) - 1; i >= 0; i-- {
        if zone[i] == '-' {
            lastDash = i
            break
        }
    }
    if lastDash <= 0 {
        return zone
    }
    // Check if trailing is digits
    trailing := zone[lastDash+1:]
    digits := true
    for i := 0; i < len(trailing); i++ {
        if trailing[i] < '0' || trailing[i] > '9' {
            digits = false
            break
        }
    }
    if digits {
        return zone[:lastDash]
    }
    return zone
}
