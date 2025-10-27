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

func IsAdmin(user *casdoorsdk.User) bool {
	if user == nil {
		return false
	}
	return user.IsAdmin || user.Tag == "Admin"
}

func IsDoctor(user *casdoorsdk.User) bool {
	if user == nil {
		return false
	}
	return user.Tag == "Doctor"
}

func IsPatient(user *casdoorsdk.User) bool {
	if user == nil {
		return false
	}
	return user.Tag == "Patient"
}

func CanEditPatient(user *casdoorsdk.User, patient *Patient) bool {
	if user == nil || patient == nil {
		return false
	}

	// Admins can edit all patients
	if IsAdmin(user) {
		return true
	}

	// Doctors who are owners can edit
	if IsDoctor(user) {
		for _, owner := range patient.Owners {
			if owner == user.Name {
				return true
			}
		}
	}

	return false
}

func FilterPatientsByUser(user *casdoorsdk.User, patients []*Patient) []*Patient {
	if user == nil {
		return []*Patient{}
	}

	// Admins can view all patients
	if IsAdmin(user) {
		return patients
	}

	// Patients cannot view any patients
	if IsPatient(user) {
		return []*Patient{}
	}

	// Doctors can only view their own patients
	if IsDoctor(user) {
		filtered := []*Patient{}
		for _, patient := range patients {
			for _, owner := range patient.Owners {
				if owner == user.Name {
					filtered = append(filtered, patient)
					break
				}
			}
		}
		return filtered
	}

	return []*Patient{}
}
