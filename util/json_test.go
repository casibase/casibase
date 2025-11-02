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
	"testing"
)

func TestGetFieldFromJsonString(t *testing.T) {
	tests := []struct {
		name      string
		jsonStr   string
		fieldName string
		want      string
		wantErr   bool
	}{
		{
			name:      "Get publicIp field",
			jsonStr:   `{"publicIp":"203.45.178.234","privateIp":"10.23.67.142"}`,
			fieldName: "publicIp",
			want:      "203.45.178.234",
			wantErr:   false,
		},
		{
			name:      "Get privateIp field",
			jsonStr:   `{"publicIp":"203.45.178.234","privateIp":"10.23.67.142"}`,
			fieldName: "privateIp",
			want:      "10.23.67.142",
			wantErr:   false,
		},
		{
			name:      "Field does not exist",
			jsonStr:   `{"publicIp":"203.45.178.234"}`,
			fieldName: "nonexistent",
			want:      "",
			wantErr:   false,
		},
		{
			name:      "Empty JSON string",
			jsonStr:   "",
			fieldName: "publicIp",
			want:      "",
			wantErr:   false,
		},
		{
			name:      "Invalid JSON",
			jsonStr:   `{invalid json}`,
			fieldName: "publicIp",
			want:      "",
			wantErr:   true,
		},
		{
			name:      "Complex properties JSON",
			jsonStr:   `{"cpu":4,"createTime":"2023-06-19T06:42:00Z","publicIp":"203.45.178.234","privateIp":"10.23.67.142"}`,
			fieldName: "publicIp",
			want:      "203.45.178.234",
			wantErr:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := GetFieldFromJsonString(tt.jsonStr, tt.fieldName)
			if (err != nil) != tt.wantErr {
				t.Errorf("GetFieldFromJsonString() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("GetFieldFromJsonString() = %v, want %v", got, tt.want)
			}
		})
	}
}
