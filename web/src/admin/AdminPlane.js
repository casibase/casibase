// Copyright 2020 The casbin Authors. All Rights Reserved.
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
import {Link, withRouter} from "react-router-dom";
import * as PlaneBackend from "../backend/PlaneBackend.js";
import * as Setting from "../Setting";
import Zmage from "react-zmage";
import {SketchPicker} from "react-color";
import i18next from "i18next";
import * as Conf from "../Conf";

class AdminPlane extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      nodes: [],
      planes: null,
      message: "",
      errorMessage: "",
      form: {},
      plane: [],
      // event: props.match.params.event,
      planeId: props.match.params.planeId,
      width: "",
      event: "basic",
      Management_LIST: [
        {label: "Basic Info", value: "basic"},
        {label: "Display", value: "display"},
      ],
      color: "",
      backgroundColor: "",
      displayColorPicker: false,
      displayBackgroundColorPicker: false,
    };
  }

  componentDidMount() {
    this.getPlane();
    this.getPlanes();
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    if (newProps.location !== this.props.location) {
      this.setState(
        {
          message: "",
          errorMessage: "",
          planeId: newProps.match.params.planeId,
        },
        () => {
          this.getPlane();
        }
      );
    }
  }

  getPlanes() {
    PlaneBackend.getPlanesAdmin().then((res) => {
      this.setState({
        planes: res,
      });
    });
  }

  getPlane() {
    if (this.state.planeId === undefined && this.props.event !== "new") {
      return;
    }

    PlaneBackend.getPlaneAdmin(this.state.planeId).then((res) => {
      this.setState(
        {
          plane: res,
          color: res?.color,
          backgroundColor: res?.backgroundColor,
        },
        () => {
          this.initForm();
        }
      );
    });
  }

  initForm() {
    const form = this.state.form;
    if (this.props.event === "new") {
      form["sorter"] = 1;
      form["visible"] = true;
    } else {
      form["id"] = this.state.plane?.id;
      form["name"] = this.state.plane?.name;
      form["createdTime"] = this.state.plane?.createdTime;
      form["sorter"] = this.state.plane?.sorter;
      form["image"] = this.state.plane?.image;
      form["backgroundColor"] = this.state.plane?.backgroundColor;
      form["color"] = this.state.plane?.color;
      form["visible"] = this.state.plane?.visible;
    }
    this.setState({
      form: form,
    });
  }

  updateFormField(key, value) {
    const form = this.state.form;
    form[key] = value;
    this.setState({
      form: form,
    });
  }

  deletePlane(plane, planeId, nodesNum) {
    if (window.confirm(`${i18next.t("plane:Are you sure to delete plane")} ${plane} ?`)) {
      if (nodesNum !== 0) {
        alert(`
        ${i18next.t("plane:Please delete all the nodes or move to another plane before deleting the plane")}
        ${i18next.t("plane:Currently the number of nodes under the plane is")} ${nodesNum}
        `);
      } else {
        PlaneBackend.deletePlane(planeId).then((res) => {
          if (res.status === "ok") {
            this.setState({
              message: `${i18next.t("plane:Delete plane")} ${plane} ${i18next.t("plane:success")}`,
            });
            this.getPlanes();
          } else {
            this.setState({
              errorMessage: res?.msg,
            });
          }
        });
      }
    }
  }

  updatePlaneInfo() {
    PlaneBackend.updatePlane(this.state.planeId, this.state.form).then((res) => {
      if (res.status === "ok") {
        this.getPlane();
        this.setState({
          message: i18next.t("plane:Update plane information success"),
        });
      } else {
        this.setState({
          message: res?.msg,
        });
      }
    });
  }

  postNewPlane() {
    if (this.state.form.id === undefined || this.state.form.id === "") {
      this.setState({
        errorMessage: "Please input plane ID",
      });
      return;
    }
    if (this.state.form.name === "" || this.state.form.name === undefined) {
      this.setState({
        errorMessage: "Please input plane name",
      });
      return;
    }

    PlaneBackend.addPlane(this.state.form).then((res) => {
      if (res.status === "ok") {
        this.getPlane();
        this.setState(
          {
            errorMessage: "",
            message: i18next.t("plane:Creat plane success"),
          },
          () => {
            setTimeout(() => this.props.history.push(`/admin/plane/edit/${this.state.form.id}`), 1600);
          }
        );
      } else {
        this.setState({
          errorMessage: res?.msg,
        });
      }
    });
  }

  clearMessage() {
    this.setState({
      message: "",
    });
  }

  clearErrorMessage() {
    this.setState({
      errorMessage: "",
    });
  }

  handleColorChange = (color, event) => {
    if (event === "color") {
      this.updateFormField("color", color.hex);
      return;
    }

    this.updateFormField("backgroundColor", color.hex);
  };

  handleColorClick = (event) => {
    if (event === "color") {
      this.setState({
        displayColorPicker: !this.state.displayColorPicker,
      });
      return;
    }

    this.setState({
      displayBackgroundColorPicker: !this.state.displayBackgroundColorPicker,
    });
  };

  handleColorClose = (event) => {
    if (event === "color") {
      this.setState({
        displayColorPicker: false,
      });
      return;
    }

    this.setState({
      displayBackgroundColorPicker: false,
    });
  };

  changeEvent(event) {
    this.setState({
      event: event,
      message: "",
    });
    if (this.props.event !== "new") {
      this.initForm();
    }
  }

  resetColor(event) {
    if (event === "color") {
      this.updateFormField("color", this.state.color);
      return;
    }

    this.updateFormField("backgroundColor", this.state.backgroundColor);
  }

  renderColorPicker(event) {
    return (
      <div
        style={{
          padding: "5px",
          background: "#fff",
          borderRadius: "1px",
          boxShadow: "0 0 0 1px rgba(0,0,0,.1)",
          display: "inline-block",
          cursor: "pointer",
        }}
        onClick={() => this.handleColorClick(event)}
      >
        <div
          style={{
            width: "36px",
            height: "14px",
            borderRadius: "2px",
            background: event === "color" ? `${this.state.form.color}` : `${this.state.form.backgroundColor}`,
          }}
        />
      </div>
    );
  }

  renderNode(node) {
    return (
      <span>
        <Link to={`/go/${encodeURIComponent(node.id)}`}>{node.name}</Link> &nbsp;{" "}
      </span>
    );
  }

  renderProblem() {
    const problems = [];

    if (this.state.errorMessage !== "") {
      problems.push(i18next.t(`error:${this.state.errorMessage}`));
    }

    if (problems.length === 0) {
      return null;
    }

    return (
      <div className="problem" onClick={() => this.clearErrorMessage()}>
        {i18next.t("error:Please resolve the following issues before submitting")}
        <ul>
          {problems.map((problem, i) => {
            return <li key={i}>{problem}</li>;
          })}
        </ul>
      </div>
    );
  }

  renderManagementList(item) {
    return (
      <a href="javascript:void(0);" className={this.state.event === item.value ? "tab_current" : "tab"} onClick={() => this.changeEvent(item.value)}>
        {i18next.t(`plane:${item.label}`)}
      </a>
    );
  }

  renderHeader() {
    return (
      <div className="box">
        <div className="header">
          <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
          <Link to={"/admin"}>{i18next.t("admin:Backstage management")}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
          <Link to={"/admin/plane"}>{i18next.t("plane:Plane management")}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
          <span>{this.props.event === "new" ? i18next.t("plane:New plane") : this.state.planeId}</span>
        </div>
        <div className="cell">
          {this.state.Management_LIST.map((item) => {
            return this.renderManagementList(item);
          })}
        </div>
      </div>
    );
  }

  renderPlanes(plane) {
    const pcBrowser = Setting.PcBrowser;

    return (
      <div className="cell">
        <table cellPadding="0" cellSpacing="0" border="0" width="100%">
          <tbody>
            <tr>
              <td width={pcBrowser ? "200" : "auto"} align="left">
                <span className="gray">{plane?.name}</span>
              </td>
              <td width={pcBrowser ? "100" : "auto"} align="center">
                <Link to={`/admin/plane/edit/${plane?.id}`}>{i18next.t("plane:Manage")}</Link>
              </td>
              <td width="10"></td>
              <td width={pcBrowser ? "120" : "80"} valign="middle" style={{textAlign: "center"}}>
                <span style={{fontSize: "13px"}}>
                  {plane?.nodesNum} {i18next.t("plane:nodes")}
                </span>
              </td>
              <td width={pcBrowser ? "120" : "80"} align="left" style={{textAlign: "center"}}>
                {plane?.visible ? <span className="positive">{i18next.t("plane:Visible")}</span> : <span className="gray">{i18next.t("plane:Invisible")}</span>}
              </td>
              <td width="50" align="left" style={{textAlign: "right"}}>
                <a href="#" onClick={() => this.deletePlane(plane?.name, plane?.id, plane?.nodesNum)}>
                  {i18next.t("plane:Delete")}
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  render() {
    const newPlane = this.props.event === "new";

    if (this.state.planeId !== undefined || newPlane) {
      if (this.state.planeId !== undefined) {
        if (this.state.plane !== null && this.state.plane.length === 0) {
          if (!Conf.ShowLoadingIndicator) {
            return null;
          }

          return (
            <div className="box">
              <div className="header">
                <Link to="/">{Setting.getForumName()}</Link>
                <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("loading:Page is loading")}
              </div>
              <div className="cell">
                <span className="gray bigger">{i18next.t("loading:Please wait patiently...")}</span>
              </div>
            </div>
          );
        }

        if (this.state.plane === null) {
          return (
            <div className="box">
              <div className="header">
                <Link to="/">{Setting.getForumName()}</Link>
                <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("error:Plane not found")}
              </div>
              <div className="cell">{i18next.t("error:The plane you are trying to view does not exist")}</div>
            </div>
          );
        }
      }

      const plane = this.state.plane;

      if (this.state.event === "basic") {
        return (
          <div>
            {this.renderHeader()}
            <div className="box">
              {this.renderProblem()}
              {this.state.message !== "" ? (
                <div className="message" onClick={() => this.clearMessage()}>
                  <li className="fa fa-exclamation-triangle"></li>
                  &nbsp; {this.state.message}
                </div>
              ) : null}
              <div className="inner">
                <table cellPadding="5" cellSpacing="0" border="0" width="100%">
                  <tbody>
                    {newPlane ? (
                      <tr>
                        <td width="120" align="right">
                          {i18next.t("plane:Plane ID")}
                        </td>
                        <td width="auto" align="left">
                          <input type="text" className="sl" name="id" id="plane_id" value={this.state.form?.id} onChange={(event) => this.updateFormField("id", event.target.value)} autoComplete="off" />
                        </td>
                      </tr>
                    ) : null}
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("plane:Plane name")}
                      </td>
                      <td width="auto" align="left">
                        <input type="text" className="sl" name="name" id="plane_name" value={this.state.form?.name === undefined ? "" : this.state.form?.name} onChange={(event) => this.updateFormField("name", event.target.value)} autoComplete="off" />
                      </td>
                    </tr>
                    {!newPlane ? (
                      <tr>
                        <td width="120" align="right">
                          {i18next.t("plane:Created time")}
                        </td>
                        <td width="auto" align="left">
                          <span className="gray">{plane?.createdTime}</span>
                        </td>
                      </tr>
                    ) : null}
                    {!newPlane ? (
                      <tr>
                        <td width="120" align="right">
                          {i18next.t("plane:Total nodes")}
                        </td>
                        <td width="auto" align="left">
                          <span className="gray">{plane?.nodesNum}</span>
                        </td>
                      </tr>
                    ) : null}
                    {!newPlane ? (
                      <tr>
                        <td width="120" align="right">
                          {i18next.t("plane:Nodes")}
                        </td>
                        <td width="auto" align="left">
                          <span className="gray">{this.state.plane?.nodes.length !== 0 ? this.state.plane?.nodes.map((node) => this.renderNode(node)) : i18next.t("plane:No node yet")}</span>
                        </td>
                      </tr>
                    ) : null}
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("plane:Sorter")}
                      </td>
                      <td width="auto" align="left">
                        <input type="range" min="1" max="1000" step="1" value={this.state.form?.sorter === undefined ? 1 : this.state.form?.sorter} onChange={(event) => this.updateFormField("sorter", parseInt(event.target.value))} />
                        &nbsp; &nbsp; <input type="number" name="sorter" min="1" max="1000" step="1" value={this.state.form?.sorter} style={{width: "50px"}} onChange={(event) => this.updateFormField("sorter", parseInt(event.target.value))} />
                      </td>
                    </tr>
                    <tr>
                      <td width="120" align="right"></td>
                      <td width="auto" align="left">
                        <span className="gray">{i18next.t("plane:Decide the order of node navigation")}</span>
                      </td>
                    </tr>
                    <tr>
                      <td width="120" align="right">
                        {i18next.t("plane:Visible")}
                      </td>
                      <td width="auto" align="left">
                        <input type="radio" onClick={() => this.updateFormField("visible", true)} checked={this.state.form?.visible} name="visible" />
                        {i18next.t("plane:Visible")} <input type="radio" onClick={() => this.updateFormField("visible", false)} checked={!this.state.form?.visible} name="visible" />
                        {i18next.t("plane:Invisible")}
                      </td>
                    </tr>
                    {!this.state.form.visible ? (
                      <tr>
                        <td width="120" align="right"></td>
                        <td width="auto" align="left">
                          <span className="gray">{i18next.t("plane:This plane will not appear on the node navigation")}</span>
                        </td>
                      </tr>
                    ) : null}
                    <tr>
                      <td width="120" align="right"></td>
                      <td width="auto" align="left">
                        {!newPlane ? <input type="submit" className="super normal button" value={i18next.t("plane:Save")} onClick={() => this.updatePlaneInfo()} /> : null}
                      </td>
                    </tr>
                    {newPlane ? (
                      <tr>
                        <td width="120" align="right"></td>
                        <td width="auto" align="left">
                          <span className="gray">{i18next.t("plane:Please go to the display page to continue to improve the information and submit")}</span>
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      }

      // display
      return (
        <div>
          {this.renderHeader()}
          <div className="box">
            {this.renderProblem()}
            {this.state.message !== "" ? (
              <div className="message" onClick={() => this.clearMessage()}>
                <li className="fa fa-exclamation-triangle"></li>
                &nbsp; {this.state.message}
              </div>
            ) : null}
            <div className="inner">
              <table cellPadding="5" cellSpacing="0" border="0" width="100%">
                <tbody>
                  <tr>
                    <td width="120" align="right">
                      {i18next.t("plane:Image")}
                    </td>
                    <td width="auto" align="left">
                      {this.state.form?.image === undefined || this.state.form?.image === "" ? (
                        <span className="gray">{i18next.t("plane:Not set")}</span>
                      ) : (
                        <Zmage src={this.state.form?.image} alt={this.state.form?.id} style={{maxWidth: "48px", maxHeight: "48px"}} />
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td width="120" align="right">
                      {newPlane ? i18next.t("plane:Set image") : i18next.t("plane:Change image")}
                    </td>
                    <td width="auto" align="left">
                      <input type="text" className="sl" name="image" id="change_image" value={this.state.form?.image === undefined ? "" : this.state.form?.image} onChange={(event) => this.updateFormField("image", event.target.value)} autoComplete="off" />
                    </td>
                  </tr>
                  <tr>
                    <td width="120" align="right">
                      {i18next.t("plane:Font color")}
                    </td>
                    <td width="auto" align="left">
                      {this.renderColorPicker("color")}
                      {this.state.displayColorPicker ? (
                        <div
                          style={{
                            position: "absolute",
                            zIndex: "2",
                          }}
                        >
                          <div
                            style={{
                              position: "fixed",
                              top: "0px",
                              right: "0px",
                              bottom: "0px",
                              left: "0px",
                            }}
                            onClick={() => this.handleColorClose("color")}
                          />
                          <SketchPicker color={this.state.form.color} onChange={(color) => this.handleColorChange(color, "color")} />
                        </div>
                      ) : null}{" "}
                      &nbsp;{" "}
                      {!newPlane ? (
                        <a href="#" onClick={() => this.resetColor("color")}>
                          {i18next.t("plane:Restore")}
                        </a>
                      ) : null}
                    </td>
                  </tr>
                  <tr>
                    <td width="120" align="right">
                      {i18next.t("plane:Background color")}
                    </td>
                    <td width="auto" align="left">
                      {this.renderColorPicker("backgroundColor")}
                      {this.state.displayBackgroundColorPicker ? (
                        <div
                          style={{
                            position: "absolute",
                            zIndex: "2",
                          }}
                        >
                          <div
                            style={{
                              position: "fixed",
                              top: "0px",
                              right: "0px",
                              bottom: "0px",
                              left: "0px",
                            }}
                            onClick={() => this.handleColorClose("backgroundColor")}
                          />
                          <SketchPicker color={this.state.form.backgroundColor} onChange={(color) => this.handleColorChange(color, "backgroundColor")} />
                        </div>
                      ) : null}{" "}
                      &nbsp;{" "}
                      {!newPlane ? (
                        <a href="#" onClick={() => this.resetColor("backgroundColor")}>
                          {i18next.t("plane:Restore")}
                        </a>
                      ) : null}
                    </td>
                  </tr>
                  <tr>
                    <td width="120" align="right">
                      {i18next.t("plane:Preview")}
                    </td>
                    <td width="auto" align="left">
                      <div
                        className="header"
                        style={{
                          backgroundColor: this.state.form?.backgroundColor,
                          color: this.state.form?.color,
                          fontSize: Setting.PcBrowser ? "" : "13px",
                        }}
                      >
                        <img src={this.state.form?.image} border="0" align="absmiddle" width="24" /> &nbsp; {this.state.form?.name}
                        <span
                          className="fr"
                          style={{
                            color: this.state.form?.color,
                            lineHeight: "20px",
                          }}
                        >
                          {this.state.form?.id} • {!newPlane ? <span className="small">{plane?.nodesNum} nodes</span> : null}
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td width="120" align="right"></td>
                    <td width="auto" align="left">
                      {newPlane ? (
                        <input type="submit" className="super normal button" value={i18next.t("plane:Create")} onClick={() => this.postNewPlane()} />
                      ) : (
                        <input type="submit" className="super normal button" value={i18next.t("plane:Save")} onClick={() => this.updatePlaneInfo()} />
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="box">
        <div className="header">
          <Link to="/">{Setting.getForumName()}</Link> <span className="chevron">&nbsp;›&nbsp;</span>
          <Link to="/admin">{i18next.t("admin:Backstage management")}</Link>
          <span className="chevron">&nbsp;›&nbsp;</span> {i18next.t("plane:Plane management")}
          <div className="fr f12">
            <span className="snow">{i18next.t("plane:Total planes")} &nbsp;</span>
            <strong className="gray">{this.state.planes === null ? 0 : this.state.planes.length}</strong>
          </div>
          <div className="fr f12">
            <strong className="gray">
              <Link to="plane/new">{i18next.t("plane:Add new plane")}</Link> &nbsp;
            </strong>
          </div>
        </div>
        {this.state.message !== "" ? (
          <div className="message" onClick={() => this.clearMessage()}>
            <li className="fa fa-exclamation-triangle"></li>
            &nbsp; {this.state.message}
          </div>
        ) : null}
        <div id="all-planes">
          {this.state.planes !== null && this.state.planes.length !== 0 ? (
            this.state.planes.map((plane) => this.renderPlanes(plane))
          ) : (
            <div
              className="cell"
              style={{
                textAlign: "center",
                height: "100px",
                lineHeight: "100px",
              }}
            >
              {this.state.planes === null ? i18next.t("loading:Data is loading...") : i18next.t("plane:No plant yet")}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default withRouter(AdminPlane);
