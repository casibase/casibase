// Copyright 2026 The OpenAgent Authors. All Rights Reserved.
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

import * as React from "react";
import i18next from "i18next";
import * as XLSX from "xlsx";
import {CheckCircle2, Download, FileSpreadsheet, Plus, Trash2, Upload, UserPlus} from "lucide-react";
import * as StudentAccountBackend from "@/backend/StudentAccountBackend";
import type {StudentAccount, StudentAccountResult} from "@/backend/StudentAccountBackend";
import {PageHeader} from "@/components/crud/PageHeader";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Progress} from "@/components/ui/progress";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {useAccount} from "@/hooks/use-account";
import * as Setting from "@/lib/setting";
import {cn} from "@/lib/utils";

type Field = keyof StudentAccount;

interface Row extends StudentAccount {
  id: number;
  status?: "ok" | "error";
  msg?: string;
}

const Fields: Field[] = ["name", "displayName", "password", "affiliation", "grade", "phone"];

// the grades the 智小研 signup form offers; the cell still takes any text
const GradeOptions = ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级", "七年级", "八年级", "九年级", "十年级", "十一年级", "十二年级"];

const InitialRowCount = 10;
const BatchSize = 50;

let nextRowId = 1;

function newRow(values?: Partial<StudentAccount>): Row {
  return {id: nextRowId++, name: "", displayName: "", password: "", affiliation: "", grade: "", phone: "", ...values};
}

function isBlank(row: StudentAccount) {
  return Fields.every((field) => row[field].trim() === "");
}

function getFieldTitle(field: Field) {
  switch (field) {
  case "name":
    return i18next.t("general:Username");
  case "displayName":
    return i18next.t("account:Real name");
  case "password":
    return i18next.t("general:Password");
  case "affiliation":
    return i18next.t("video:School");
  case "grade":
    return i18next.t("store:Grade");
  case "phone":
    return i18next.t("account:Phone (optional)");
  }
}

/** Which field a template or spreadsheet header names, by keyword so 账号 / 学号 / 学生姓名 / Username all work. */
function getFieldOfHeader(header: string): Field | null {
  const text = header.trim().toLowerCase();
  if (text.includes("用户名") || text.includes("账号") || text.includes("帐号") || text.includes("学号") || text.includes("username") || text === "account") {
    return "name";
  }
  if (text.includes("密码") || text.includes("password")) {
    return "password";
  }
  if (text.includes("姓名") || text.includes("名字") || text.includes("name")) {
    return "displayName";
  }
  if (text.includes("学校") || text.includes("school") || text.includes("affiliation")) {
    return "affiliation";
  }
  if (text.includes("年级") || text.includes("grade")) {
    return "grade";
  }
  if (text.includes("手机") || text.includes("电话") || text.includes("phone")) {
    return "phone";
  }
  return null;
}

function downloadTemplate() {
  const header = Fields.map((field) => getFieldTitle(field));
  const sheet = XLSX.utils.aoa_to_sheet([header]);
  sheet["!cols"] = Fields.map(() => ({wch: 16}));
  const notes = XLSX.utils.aoa_to_sheet([
    [i18next.t("account:How to fill in")],
    [i18next.t("account:One student per row, starting from the second row of the first sheet")],
    [i18next.t("account:Username - letters and digits, e.g. zhangsan01, used by the student to sign in")],
    [i18next.t("account:Name - the student's real name")],
    [i18next.t("account:Password - at least 6 characters, generated when left empty")],
    [i18next.t("account:School and grade - the defaults chosen on the page are used when left empty")],
    [i18next.t("account:Phone - optional, a phone number can be used by one account only")],
  ]);
  notes["!cols"] = [{wch: 80}];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, i18next.t("account:Students"));
  XLSX.utils.book_append_sheet(workbook, notes, i18next.t("account:How to fill in"));
  XLSX.writeFile(workbook, `${i18next.t("account:Student account template")}.xlsx`, {compression: true});
}

/** Reads the first sheet; the first row with a recognizable header decides the columns. */
function readStudents(data: ArrayBuffer): StudentAccount[] {
  const workbook = XLSX.read(data, {type: "array"});
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error(i18next.t("general:No sheets found in file"));
  }
  const table = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets[workbook.SheetNames[0]], {header: 1, defval: "", raw: false});
  const headerIndex = table.findIndex((cells) => cells.some((cell) => getFieldOfHeader(String(cell)) === "name"));
  if (headerIndex < 0) {
    throw new Error(i18next.t("account:No username column found, please use the template"));
  }
  const columns = table[headerIndex].map((cell) => getFieldOfHeader(String(cell)));
  return table.slice(headerIndex + 1)
    .map((cells) => {
      const student: StudentAccount = {name: "", displayName: "", password: "", affiliation: "", grade: "", phone: ""};
      columns.forEach((field, index) => {
        if (field !== null && student[field] === "") {
          student[field] = String(cells[index] ?? "").trim();
        }
      });
      return student;
    })
    .filter((student) => !isBlank(student));
}

export default function StudentAccountPage() {
  const {account} = useAccount();
  const [rows, setRows] = React.useState<Row[]>(() => Array.from({length: InitialRowCount}, () => newRow()));
  const [defaultSchool, setDefaultSchool] = React.useState("");
  const [defaultGrade, setDefaultGrade] = React.useState("");
  const [prefix, setPrefix] = React.useState("");
  const [start, setStart] = React.useState("01");
  const [progress, setProgress] = React.useState<number | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (account?.affiliation) {
      setDefaultSchool((school) => school || account.affiliation);
    }
  }, [account?.affiliation]);

  const pending = rows.filter((row) => row.status !== "ok" && !isBlank(row));
  const created = rows.filter((row) => row.status === "ok");
  const submitting = progress !== null;

  const updateCell = (id: number, field: Field, value: string) => {
    setRows((current) => current.map((row) => (row.id === id ? {...row, [field]: value, status: undefined, msg: undefined} : row)));
  };

  // Pasting cells copied from Excel or WPS fills the table from this cell on, adding rows as needed.
  const pasteCells = (event: React.ClipboardEvent<HTMLInputElement>, rowIndex: number, fieldIndex: number) => {
    const text = event.clipboardData.getData("text/plain");
    if (!text.includes("\t") && !text.includes("\n")) {
      return;
    }
    event.preventDefault();
    const lines = text.replace(/\r/g, "").replace(/\n+$/, "").split("\n").map((line) => line.split("\t"));
    setRows((current) => {
      const next = [...current];
      lines.forEach((cells, lineIndex) => {
        const index = rowIndex + lineIndex;
        while (next.length <= index) {
          next.push(newRow());
        }
        const row = {...next[index], status: undefined, msg: undefined};
        cells.forEach((cell, cellIndex) => {
          const field = Fields[fieldIndex + cellIndex];
          if (field) {
            row[field] = cell.trim();
          }
        });
        next[index] = row;
      });
      return next;
    });
  };

  const addRows = (count: number) => {
    setRows((current) => [...current, ...Array.from({length: count}, () => newRow())]);
  };

  const removeRow = (id: number) => {
    setRows((current) => current.filter((row) => row.id !== id));
  };

  const removeCreated = () => {
    setRows((current) => {
      const next = current.filter((row) => row.status !== "ok");
      return next.length > 0 ? next : [newRow()];
    });
  };

  const clearAll = () => {
    setRows(Array.from({length: InitialRowCount}, () => newRow()));
  };

  const fillUsernames = () => {
    const width = start.length;
    let number = parseInt(start, 10);
    if (prefix.trim() === "" || isNaN(number)) {
      Setting.showMessage("error", i18next.t("account:Please enter a prefix and a starting number"));
      return;
    }
    setRows((current) => current.map((row) => {
      if (row.status === "ok" || row.name.trim() !== "" || row.displayName.trim() === "") {
        return row;
      }
      const name = `${prefix.trim()}${String(number++).padStart(width, "0")}`;
      return {...row, name, status: undefined, msg: undefined};
    }));
  };

  const importFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const students = readStudents(e.target?.result as ArrayBuffer);
        if (students.length === 0) {
          Setting.showMessage("warning", i18next.t("account:No students found in the file"));
          return;
        }
        setRows((current) => [...current.filter((row) => !isBlank(row)), ...students.map((student) => newRow(student))]);
        Setting.showMessage("success", i18next.t("account:Imported %s students, please check them and click Create").replace("%s", String(students.length)));
      } catch (err: any) {
        Setting.showMessage("error", `${i18next.t("general:Failed to upload")}: ${err?.message ?? err}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const submit = async() => {
    const batch = pending.map((row) => ({
      id: row.id,
      name: row.name.trim(),
      displayName: row.displayName.trim(),
      password: row.password.trim(),
      affiliation: row.affiliation.trim() || defaultSchool.trim(),
      grade: row.grade.trim() || defaultGrade.trim(),
      phone: row.phone.trim(),
    }));
    if (batch.length === 0) {
      Setting.showMessage("warning", i18next.t("account:Please fill in at least one student"));
      return;
    }

    const results = new Map<number, StudentAccountResult>();
    setProgress(0);
    try {
      for (let i = 0; i < batch.length; i += BatchSize) {
        const chunk = batch.slice(i, i + BatchSize);
        const res = await StudentAccountBackend.addStudentAccounts(chunk.map(({id: _id, ...student}) => student));
        if (res.status !== "ok") {
          Setting.showMessage("error", res.msg);
          break;
        }
        (res.data as StudentAccountResult[]).forEach((result, index) => results.set(chunk[index].id, result));
        setProgress(Math.round((i + chunk.length) * 100 / batch.length));
      }
    } catch (err: any) {
      Setting.showMessage("error", err?.message ?? String(err));
    } finally {
      setProgress(null);
    }

    const byId = new Map(batch.map((student) => [student.id, student]));
    setRows((current) => current.map((row) => {
      const result = results.get(row.id);
      if (!result) {
        return row;
      }
      const sent = byId.get(row.id)!;
      return result.ok
        ? {...row, ...sent, id: row.id, password: result.password, status: "ok", msg: ""}
        : {...row, status: "error", msg: result.msg};
    }));

    const okCount = [...results.values()].filter((result) => result.ok).length;
    const failedCount = results.size - okCount;
    if (failedCount === 0 && okCount > 0) {
      Setting.showMessage("success", i18next.t("account:Created %s accounts, remember to download the account list").replace("%s", String(okCount)));
    } else if (results.size > 0) {
      Setting.showMessage("warning", i18next.t("account:Created %s accounts, %s failed, see the rows in red")
        .replace("%s", String(okCount)).replace("%s", String(failedCount)));
    }
  };

  const downloadCreated = () => {
    const header = [...Fields.filter((field) => field !== "phone").map((field) => getFieldTitle(field)), i18next.t("account:Sign-in address")];
    const lines = created.map((row) => [row.name, row.displayName, row.password, row.affiliation, row.grade, window.location.origin]);
    const sheet = XLSX.utils.aoa_to_sheet([header, ...lines]);
    sheet["!cols"] = header.map(() => ({wch: 18}));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, i18next.t("account:Students"));
    XLSX.writeFile(workbook, `${i18next.t("account:Student accounts")}-${new Date().toISOString().slice(0, 10)}.xlsx`, {compression: true});
  };

  if (!Setting.isLocalAdminUser(account) || Setting.isBasicLoginMode(account)) {
    return (
      <div className="space-y-4">
        <PageHeader title={i18next.t("account:Student Accounts")} />
        <p className="text-sm text-muted-foreground">{i18next.t("account:Only teachers can add student accounts")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={i18next.t("account:Student Accounts")}
        description={i18next.t("account:Add many student accounts at once - fill in the table below, paste rows copied from Excel, or import the template")}
        actions={
          <>
            <Button variant="outline" onClick={downloadTemplate}>
              <FileSpreadsheet />
              {i18next.t("general:Download template")}
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={submitting}>
              <Upload />
              {i18next.t("account:Import Excel")}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  importFile(file);
                }
                e.target.value = "";
              }}
            />
          </>
        }
      />

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="default-school">{i18next.t("account:Default school")}</Label>
            <Input id="default-school" value={defaultSchool} onChange={(e) => setDefaultSchool(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="default-grade">{i18next.t("account:Default grade")}</Label>
            <Input id="default-grade" list="student-grade-options" value={defaultGrade} onChange={(e) => setDefaultGrade(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{i18next.t("account:Number the usernames")}</Label>
            <div className="flex gap-2">
              <Input aria-label={i18next.t("account:Prefix")} placeholder={i18next.t("account:Prefix, e.g. class3")} value={prefix} onChange={(e) => setPrefix(e.target.value)} />
              <Input aria-label={i18next.t("account:Starting number")} className="w-24" value={start} onChange={(e) => setStart(e.target.value.replace(/\D/g, ""))} />
              <Button variant="outline" onClick={fillUsernames}>{i18next.t("account:Fill empty usernames")}</Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-4">
            {i18next.t("account:Rows with an empty school or grade use the defaults; an empty password is generated. Every account is created as a student")}
          </p>
        </CardContent>
      </Card>

      <datalist id="student-grade-options">
        {GradeOptions.map((grade) => <option key={grade} value={grade} />)}
      </datalist>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 text-center">#</TableHead>
              {Fields.map((field) => (
                <TableHead key={field} className="min-w-[140px] whitespace-nowrap">
                  {getFieldTitle(field)}
                  {field === "name" || field === "displayName" ? <span className="text-destructive"> *</span> : null}
                </TableHead>
              ))}
              <TableHead className="min-w-[160px]">{i18next.t("account:Creation result")}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={row.id} className={cn(row.status === "ok" && "bg-success/5", row.status === "error" && "bg-destructive/5")}>
                <TableCell className="text-center text-xs text-muted-foreground tabular-nums">{rowIndex + 1}</TableCell>
                {Fields.map((field, fieldIndex) => (
                  <TableCell key={field} className="p-1">
                    <Input
                      className="h-8"
                      value={row[field]}
                      readOnly={row.status === "ok"}
                      list={field === "grade" ? "student-grade-options" : undefined}
                      placeholder={field === "password" ? i18next.t("account:Generated if empty") :
                        field === "affiliation" ? defaultSchool : field === "grade" ? defaultGrade : undefined}
                      onChange={(e) => updateCell(row.id, field, e.target.value)}
                      onPaste={(e) => pasteCells(e, rowIndex, fieldIndex)}
                    />
                  </TableCell>
                ))}
                <TableCell className="text-xs">
                  {row.status === "ok" ? (
                    <span className="inline-flex items-center gap-1 text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {i18next.t("account:Account created")}
                    </span>
                  ) : row.status === "error" ? (
                    <span className="text-destructive">{row.msg}</span>
                  ) : null}
                </TableCell>
                <TableCell className="p-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={i18next.t("general:Delete")} onClick={() => removeRow(row.id)} disabled={submitting}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => addRows(1)}>
          <Plus />
          {i18next.t("account:Add a row")}
        </Button>
        <Button variant="outline" onClick={() => addRows(10)}>
          <Plus />
          {i18next.t("account:Add 10 rows")}
        </Button>
        <Button variant="ghost" onClick={clearAll} disabled={submitting}>
          {i18next.t("account:Clear the table")}
        </Button>
        <div className="flex-1" />
        {created.length > 0 ? (
          <>
            <Button variant="ghost" onClick={removeCreated} disabled={submitting}>
              {i18next.t("account:Remove created rows")}
            </Button>
            <Button variant="outline" onClick={downloadCreated}>
              <Download />
              {i18next.t("account:Download the account list")} ({created.length})
            </Button>
          </>
        ) : null}
        <Button onClick={submit} disabled={submitting || pending.length === 0}>
          <UserPlus />
          {i18next.t("account:Create %s accounts").replace("%s", String(pending.length))}
        </Button>
      </div>

      {submitting ? <Progress value={progress ?? 0} /> : null}
    </div>
  );
}
