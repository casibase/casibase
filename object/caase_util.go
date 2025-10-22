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
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
)

func FilterCaasesByUser(user *casdoorsdk.User, caases []*Caase) []*Caase {
	if user == nil {
		return []*Caase{}
	}

	// Admins can view all cases
	if IsAdmin(user) {
		return caases
	}

	// Doctors can only view their own cases (where they are the doctor)
	if IsDoctor(user) {
		filtered := []*Caase{}
		for _, caase := range caases {
			if caase.DoctorName == user.Name {
				filtered = append(filtered, caase)
			}
		}
		return filtered
	}

	// Patients can only view their own cases
	if IsPatient(user) {
		filtered := []*Caase{}
		for _, caase := range caases {
			if caase.PatientName == user.Name {
				filtered = append(filtered, caase)
			}
		}
		return filtered
	}

	return []*Caase{}
}
