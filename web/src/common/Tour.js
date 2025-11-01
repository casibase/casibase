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
import Joyride, {ACTIONS, EVENTS, STATUS} from "react-joyride";
import i18next from "i18next";

class Tour extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      run: false,
      stepIndex: 0,
    };
  }

  componentDidMount() {
    const isTourShown = localStorage.getItem(`isTourShown_${this.props.name}`);
    if (isTourShown !== "true") {
      this.setState({
        run: true,
      });
    }

    window.addEventListener("startTour", this.handleStartTour);
  }

  componentWillUnmount() {
    window.removeEventListener("startTour", this.handleStartTour);
  }

  handleStartTour = () => {
    this.setState({
      run: true,
      stepIndex: 0,
    });
  };

  handleJoyrideCallback = (data) => {
    const {action, index, status, type} = data;

    if (([STATUS.FINISHED, STATUS.SKIPPED]).includes(status)) {
      this.setState({run: false, stepIndex: 0});
      localStorage.setItem(`isTourShown_${this.props.name}`, "true");
    } else if (([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND]).includes(type)) {
      const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      this.setState({
        stepIndex: nextStepIndex,
      });
    }
  };

  render() {
    const {run, stepIndex} = this.state;
    const {steps} = this.props;

    const locale = {
      back: i18next.t("tour:Back"),
      close: i18next.t("tour:Close"),
      last: i18next.t("tour:Last"),
      next: i18next.t("tour:Next"),
      skip: i18next.t("tour:Skip"),
    };

    return (
      <Joyride
        continuous
        run={run}
        stepIndex={stepIndex}
        steps={steps}
        callback={this.handleJoyrideCallback}
        locale={locale}
        showProgress
        showSkipButton
        styles={{
          options: {
            primaryColor: "#1890ff",
            zIndex: 10000,
          },
        }}
      />
    );
  }
}

export default Tour;
