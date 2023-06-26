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
      Setting.openLink(Setting.getMyProfileUrl(account).replace("/account", `/permissions/${newPermission.owner}/${newPermission.name}`));
    }
    )
    .catch(error => {
      Setting.showMessage("error", `Permission failed to add: ${error}`);
    });
}
