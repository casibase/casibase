// Copyright 2026 The OpenAgent Authors. All Rights Reserved.
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

import * as Setting from "@/lib/setting";

export interface StudentAccount {
  name: string;
  displayName: string;
  password: string;
  affiliation: string;
  grade: string;
  phone: string;
}

export interface StudentAccountResult {
  name: string;
  displayName: string;
  password: string;
  ok: boolean;
  msg: string;
}

export function addStudentAccounts(students: StudentAccount[]) {
  return fetch(`${Setting.ServerUrl}/api/add-student-accounts`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(students),
    headers: {
      "Accept-Language": Setting.getAcceptLanguage(),
    },
  }).then(res => Setting.handleFetchResponse(res));
}
