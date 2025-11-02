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
	"testing"
)

func TestAsset_GetScanTarget(t *testing.T) {
	tests := []struct {
		name    string
		asset   *Asset
		want    string
		wantErr bool
	}{
		{
			name: "Virtual Machine with publicIp in properties",
			asset: &Asset{
				Id:         "i-7x9mk3f5n8p2q6r4s1t9",
				Type:       "Virtual Machine",
				Properties: `{"cpu":4,"publicIp":"203.45.178.234","privateIp":"10.23.67.142"}`,
			},
			want:    "203.45.178.234",
			wantErr: false,
		},
		{
			name: "Virtual Machine without publicIp in properties (fallback to Id)",
			asset: &Asset{
				Id:         "i-7x9mk3f5n8p2q6r4s1t9",
				Type:       "Virtual Machine",
				Properties: `{"cpu":4,"privateIp":"10.23.67.142"}`,
			},
			want:    "i-7x9mk3f5n8p2q6r4s1t9",
			wantErr: false,
		},
		{
			name: "Virtual Machine with empty properties (fallback to Id)",
			asset: &Asset{
				Id:         "i-7x9mk3f5n8p2q6r4s1t9",
				Type:       "Virtual Machine",
				Properties: "",
			},
			want:    "i-7x9mk3f5n8p2q6r4s1t9",
			wantErr: false,
		},
		{
			name: "Non-Virtual Machine type uses Id",
			asset: &Asset{
				Id:         "storage-bucket-123",
				Type:       "Storage",
				Properties: `{"publicIp":"203.45.178.234"}`,
			},
			want:    "storage-bucket-123",
			wantErr: false,
		},
		{
			name: "Virtual Machine with invalid JSON in properties",
			asset: &Asset{
				Id:         "i-7x9mk3f5n8p2q6r4s1t9",
				Type:       "Virtual Machine",
				Properties: `{invalid json}`,
			},
			want:    "",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := tt.asset.GetScanTarget()
			if (err != nil) != tt.wantErr {
				t.Errorf("Asset.GetScanTarget() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("Asset.GetScanTarget() = %v, want %v", got, tt.want)
			}
		})
	}
}
