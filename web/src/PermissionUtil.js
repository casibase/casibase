// Copyright 2023 The Casibase Authors. All Rights Reserved.
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

import * as PermissionBackend from "./backend/PermissionBackend";
import * as Setting from "./Setting";
import moment from "moment";

export function addPermission(account, store, file = null, fileKeys = null) {
  const randomName = Setting.getRandomName();
  const newPermission = {
    owner: account.owner,
    name: `permission_${randomName}`,
    createdTime: moment().format(),
    displayName: `New Permission - ${randomName}`,
    users: [],
    roles: [],
    domains: [store.name],
    model: "Default",
    resourceType: "TreeNode",
    resources: (file !== null) ? [file.key] : fileKeys,
    actions: ["Read"],
    effect: "Allow",
    isEnabled: true,
    submitter: account.name,
    approver: "",
    approveTime: "",
    state: "Pending",
  };

  if (Setting.isLocalAdminUser(account)) {
    newPermission.approver = account.name;
    newPermission.approveTime = moment().format();
    newPermission.state = "Approved";
  } else {
    const userId = `${account.owner}/${account.name}`;
    newPermission.users = [userId];
  }

  PermissionBackend.addPermission(newPermission)
    .then((res) => {
      if (res.status === "ok") {
        Setting.openLink(Setting.getMyProfileUrl(account).replace("/account", `/permissions/${newPermission.owner}/${newPermission.name}`));
      } else {
        Setting.showMessage("error", `Permission failed to add: ${res.msg}`);
      }
    })
    .catch(error => {
      Setting.showMessage("error", `Permission failed to add: ${error}`);
    });
}
