import React from "react";
import { render } from "@testing-library/react";
import App from "./App";

// eslint-disable-next-line no-undef
test("renders learn react link", () => {
  const { getByText } = render(<App />);
  const linkElement = getByText(/learn react/i);
  // eslint-disable-next-line no-undef
  expect(linkElement).toBeInTheDocument();
});
