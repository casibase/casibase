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
import * as Setting from "../Setting";
import '../Bottom.css';
import './node-casbin.css';
import i18next from "i18next";

class PageColumn extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      maxPages: -1,
      minPage: 1,
      showPages: [],
      defaultPageNum: 20
    };
    if (this.props.defaultPageNum !== undefined) {
      this.state.defaultPageNum = this.props.defaultPageNum;
    }
  }

  componentDidMount() {
    this.getMaxPage();
  }

  keyUp = (e) => {
    if (e.keyCode === 13) {
      this.gotoPage(this.props.url ,e.target.value);
    }
  }

  getMaxPage() {
    this.setState({
      maxPage: this.handelMaxPage(this.props.total)
    }, () => {
      if (this.props.page > this.state.maxPage) this.gotoPage(this.props.url, this.state.maxPage);
      if (this.props.page < this.state.minPage) this.gotoPage(this.props.url, this.state.minPage);
      this.getPages();
    });
  }

  getPages() {
    this.setState({
      showPages: this.getShowPages(this.props.page, this.state.maxPage)
    });
  }

  handelMaxPage(total) {
    let res;
    res = Math.ceil(total / this.state.defaultPageNum);
    if (res !== 0) {
      return res;
    }
    return 1;
  }

  //Get an array of page number, and there always should have 10 elements except '...'.
  getShowPages(page, total) {
    let pages = [];

    if (total <= 10) {
      for (let i = 1; i <= total; i ++) {
        pages.push(i);
      }
      return pages;
    }
    if (page < 6) {
      for (let i = 1; i <= 10; i ++) {
        pages.push(i);
      }
      pages.push("...");
      pages.push(total);
      return pages;
    }

    let left = page, right = page, sum = 9;
    pages.push(page);

    for (let i = 0; i < 5; i ++) {
      right ++;
      if (right >= total) {
        break;
      }
      pages.push(right);
      sum --;
    }
    for (let i = 0; i < sum; i ++) {
      left --;
      pages.unshift(left);
    }
    pages.unshift(1, "...");
    if (page !== total) {
      pages.push("...", total);
    }

    return pages;
  }

  renderPage(i, page, url) {
    return (
      <span>
        {page === i ? <a href={`${url}?p=${i}`} className={`page_current ${this.props.nodeId}`}>{i}</a> : i === "..." ? <span className="fade"> ... </span> : <a href={`${url}?p=${i}`} className={`page_normal ${this.props.nodeId}`}>{i}</a>}
        &nbsp;
      </span>
    )
  }

  gotoPage(url, page) {
    Setting.goToLink(`${url}?p=${page}`);
  }

  render() {
    if (this.state.maxPage <= 1) {
      return null;
    }
    const {page, url} = this.props;

    if (!Setting.PcBrowser) {
      return (
        <div class="inner">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="120" align="left">
                <input type="button" onClick={() => {
                  this.gotoPage(url, page - 1)
                }} value={`‹ ${i18next.t("topic:Last")}`} className="super normal button" style={{display: page > 1 ? "block" : "none"}}/>
              </td>
              <td width="auto" align="center">
                <strong class="fade">
                  {page}/{this.state.maxPage}
                </strong>
              </td>
              <td width="120" align="right">
                <input type="button" onClick={() => {
                  this.gotoPage(url, page + 1)
                }} value={`${i18next.t("topic:Next")} ›`} className="super normal button" />
              </td>
            </tr>
          </table>
        </div>
      )
    }

    return (
      <div className={`cell ${this.props.nodeId}`}
           style={{backgroundImage: "url('/static/img/shadow_light.png')", backgroundSize: "20px 20px", backgroundRepeat: "repeat-x"}}>
        <table cellPadding="0" cellSpacing="0" border="0" width="100%">
          <tr>
            <td width="92%" align="left">
              {
                this.state.showPages.map((i) => {
                  return this.renderPage(i, page, url);
                })
              }
              <input type="number" className="page_input" autoComplete="off" defaultValue={page} min="1"
                     max={this.state.maxPage} onKeyDown={this.keyUp}/>
            </td>
            <td width="8%" align="right">
              <table cellPadding="0" cellSpacing="0" border="0" width="100%">
                <tr>
                  {
                    page <= 1 ?
                      <td width="50%" align="center" className="super normal button disable_now"
                          style={{borderRight: "none", borderTopRightRadius: "0px", borderBottomRightRadius: "0px"}}>
                        ❮
                      </td> :
                      <td width="50%" align="center"
                          className={"super normal button button pageColumn"}
                          style={{borderRight: "none", borderTopRightRadius: "0px", borderBottomRightRadius: "0px"}}
                          onClick={() => {
                            this.gotoPage(url, page - 1)
                          }}
                          title="Front page">
                        ❮
                      </td>
                  }
                  {
                    page >= this.state.maxPage ?
                      <td width="50%" align="center" className="super normal_page_right button disable_now"
                          style={{borderTopLeftRadius: "0px", borderBottomLeftRadius: "0px"}}>
                        ❯
                      </td> :
                      <td width="50%" align="center"
                          className={"super normal_page_right button pageColumn"}
                          style={{borderTopLeftRadius: "0px", borderBottomLeftRadius: "0px"}}
                          onClick={() => {
                            this.gotoPage(url, page + 1)
                          }}
                          title="Next page">
                        ❯
                      </td>
                  }
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    )
  }
}

export default PageColumn;
