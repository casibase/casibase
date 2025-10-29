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

import {render, waitFor} from "@testing-library/react";
import "@testing-library/jest-dom";
import {getProviderLogoWidget} from "./Provider";
import * as Setting from "./Setting";

// Mock the Setting module
// eslint-disable-next-line no-undef
jest.mock("./Setting");

// eslint-disable-next-line no-undef
describe("Provider Logo Fallback", () => {
  // eslint-disable-next-line no-undef
  beforeEach(() => {
    // Reset mocks before each test
    // eslint-disable-next-line no-undef
    jest.clearAllMocks();
  });

  // eslint-disable-next-line no-undef
  test("renders provider logo with fallback mechanism", () => {
    const mockProvider = {
      category: "Model",
      type: "OpenAI",
    };

    Setting.getOtherProviderInfo.mockReturnValue({
      Model: {
        OpenAI: {
          url: "https://platform.openai.com",
          logo: "https://cdn.casibase.com/img/social_openai.svg",
        },
      },
    });

    Setting.getProviderLogoURL.mockReturnValue("https://cdn.casibase.com/img/social_openai.svg");

    const widget = getProviderLogoWidget(mockProvider);
    const {container} = render(widget);

    const img = container.querySelector("img");
    // eslint-disable-next-line no-undef
    expect(img).toBeInTheDocument();
    // eslint-disable-next-line no-undef
    expect(img).toHaveAttribute("src", "https://cdn.casibase.com/img/social_openai.svg");
    // eslint-disable-next-line no-undef
    expect(img).toHaveAttribute("alt", "OpenAI");
  });

  // eslint-disable-next-line no-undef
  test("handles fallback when image fails to load", async() => {
    const mockProvider = {
      category: "Model",
      type: "OpenAI",
    };

    Setting.getOtherProviderInfo.mockReturnValue({
      Model: {
        OpenAI: {
          url: "https://platform.openai.com",
          logo: "https://cdn.casibase.com/img/social_openai.svg",
        },
      },
    });

    Setting.getProviderLogoURL.mockReturnValue("https://cdn.casibase.com/img/social_openai.svg");

    const widget = getProviderLogoWidget(mockProvider);
    const {container} = render(widget);

    const img = container.querySelector("img");
    // eslint-disable-next-line no-undef
    expect(img).toBeInTheDocument();

    // Simulate image load error
    await waitFor(() => {
      img.dispatchEvent(new Event("error"));
    });

    await waitFor(() => {
      // eslint-disable-next-line no-undef
      expect(img).toHaveAttribute("src", "https://cdn.casibase.org/img/social_openai.svg");
    });
  });

  // eslint-disable-next-line no-undef
  test("returns null when provider is undefined", () => {
    const widget = getProviderLogoWidget(undefined);
    // eslint-disable-next-line no-undef
    expect(widget).toBeNull();
  });

  // eslint-disable-next-line no-undef
  test("renders logo without link when provider URL is empty", () => {
    const mockProvider = {
      category: "Model",
      type: "Local",
    };

    Setting.getOtherProviderInfo.mockReturnValue({
      Model: {
        Local: {
          url: "",
          logo: "https://cdn.casibase.com/img/social_local.jpg",
        },
      },
    });

    Setting.getProviderLogoURL.mockReturnValue("https://cdn.casibase.com/img/social_local.jpg");

    const widget = getProviderLogoWidget(mockProvider);
    const {container} = render(widget);

    const img = container.querySelector("img");
    // eslint-disable-next-line no-undef
    expect(img).toBeInTheDocument();
    // eslint-disable-next-line no-undef
    expect(img).toHaveAttribute("src", "https://cdn.casibase.com/img/social_local.jpg");

    // Ensure there's no anchor tag
    const anchor = container.querySelector("a");
    // eslint-disable-next-line no-undef
    expect(anchor).not.toBeInTheDocument();
  });
});
