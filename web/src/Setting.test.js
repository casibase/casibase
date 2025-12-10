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

import * as Setting from "./Setting";

describe("Permission utility functions", () => {
  describe("isAdminUser", () => {
    test("returns false for null account", () => {
      expect(Setting.isAdminUser(null)).toBe(false);
    });

    test("returns false for undefined account", () => {
      expect(Setting.isAdminUser(undefined)).toBe(false);
    });

    test("returns true for built-in owner", () => {
      const account = {owner: "built-in", name: "admin"};
      expect(Setting.isAdminUser(account)).toBe(true);
    });

    test("returns true for account with isAdmin=true", () => {
      const account = {owner: "org1", name: "user1", isAdmin: true};
      expect(Setting.isAdminUser(account)).toBe(true);
    });

    test("returns false for regular user", () => {
      const account = {owner: "org1", name: "user1", isAdmin: false};
      expect(Setting.isAdminUser(account)).toBe(false);
    });
  });

  describe("isChatAdminUser", () => {
    test("returns false for null account", () => {
      expect(Setting.isChatAdminUser(null)).toBe(false);
    });

    test("returns false for undefined account", () => {
      expect(Setting.isChatAdminUser(undefined)).toBe(false);
    });

    test("returns true for chat-admin type", () => {
      const account = {owner: "org1", name: "user1", type: "chat-admin"};
      expect(Setting.isChatAdminUser(account)).toBe(true);
    });

    test("returns false for non-chat-admin type", () => {
      const account = {owner: "org1", name: "user1", type: "chat-user"};
      expect(Setting.isChatAdminUser(account)).toBe(false);
    });

    test("returns false for regular user without type", () => {
      const account = {owner: "org1", name: "user1"};
      expect(Setting.isChatAdminUser(account)).toBe(false);
    });
  });

  describe("canViewAllUsers", () => {
    test("returns false for null account", () => {
      expect(Setting.canViewAllUsers(null)).toBe(false);
    });

    test("returns false for undefined account", () => {
      expect(Setting.canViewAllUsers(undefined)).toBe(false);
    });

    test("returns true for admin user", () => {
      const account = {owner: "org1", name: "admin"};
      expect(Setting.canViewAllUsers(account)).toBe(true);
    });

    test("returns true for chat-admin user", () => {
      const account = {owner: "org1", name: "user1", type: "chat-admin"};
      expect(Setting.canViewAllUsers(account)).toBe(true);
    });

    test("returns false for regular user", () => {
      const account = {owner: "org1", name: "user1"};
      expect(Setting.canViewAllUsers(account)).toBe(false);
    });
  });

  describe("isLocalAdminUser", () => {
    test("returns false for null account", () => {
      expect(Setting.isLocalAdminUser(null)).toBe(false);
    });

    test("returns false for undefined account", () => {
      expect(Setting.isLocalAdminUser(undefined)).toBe(false);
    });

    test("returns true for chat-admin user", () => {
      const account = {owner: "org1", name: "user1", type: "chat-admin"};
      expect(Setting.isLocalAdminUser(account)).toBe(true);
    });

    test("returns true for admin user with isAdmin=true", () => {
      const account = {owner: "org1", name: "admin", isAdmin: true};
      expect(Setting.isLocalAdminUser(account)).toBe(true);
    });

    test("returns true for built-in owner", () => {
      const account = {owner: "built-in", name: "admin"};
      expect(Setting.isLocalAdminUser(account)).toBe(true);
    });

    test("returns false for regular user", () => {
      const account = {owner: "org1", name: "user1", type: "chat-user"};
      expect(Setting.isLocalAdminUser(account)).toBe(false);
    });
  });

  describe("isLocalAndStoreAdminUser", () => {
    test("returns false for null account", () => {
      expect(Setting.isLocalAndStoreAdminUser(null)).toBe(false);
    });

    test("returns false for undefined account", () => {
      expect(Setting.isLocalAndStoreAdminUser(undefined)).toBe(false);
    });

    test("returns false for non-store-admin", () => {
      const account = {
        owner: "built-in",
        name: "admin",
        homepage: "non-store-admin",
      };
      expect(Setting.isLocalAndStoreAdminUser(account)).toBe(false);
    });

    test("returns true for chat-admin user", () => {
      const account = {owner: "org1", name: "user1", type: "chat-admin"};
      expect(Setting.isLocalAndStoreAdminUser(account)).toBe(true);
    });

    test("returns true for admin user with isAdmin=true", () => {
      const account = {owner: "org1", name: "admin", isAdmin: true};
      expect(Setting.isLocalAndStoreAdminUser(account)).toBe(true);
    });

    test("returns true for built-in owner", () => {
      const account = {owner: "built-in", name: "admin"};
      expect(Setting.isLocalAndStoreAdminUser(account)).toBe(true);
    });

    test("returns false for regular user", () => {
      const account = {owner: "org1", name: "user1", type: "chat-user"};
      expect(Setting.isLocalAndStoreAdminUser(account)).toBe(false);
    });
  });
});
