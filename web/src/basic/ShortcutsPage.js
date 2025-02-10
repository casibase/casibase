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

import React from "react";
import * as Setting from "../Setting";
import GridCards from "./GridCards";
import * as Conf from "../Conf";

const ShortcutsPage = () => {
  const getItems = () => {
    return Conf.ShortcutPageItems.map((item, i) => {
      const name = ["/organizations", "/users", "/providers", "/applications"][i % 4];
      item.logo = `${Setting.StaticBaseUrl}/img${name}.png`;
      item.createdTime = "";
      return item;
    });
  };

  return (
    <div style={{display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center"}}>
      <GridCards items={getItems()} />
    </div>
  );
};

export default ShortcutsPage;
