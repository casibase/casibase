// Copyright 2024 The Casibase Authors. All Rights Reserved.
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
import GuacdPage from "./GuacdPage";
import {useLocation, useParams} from "react-router-dom";

const AccessPage = () => {
  const {owner, name} = useParams();
  const query = new URLSearchParams(useLocation().search);
  const username = query.get("username") || "";
  const password = query.get("password") || "";
  return <GuacdPage nodeId={`${owner}/${name}`} username={`${username}`} password={`${password}`} />;
};

export default AccessPage;
