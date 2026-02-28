import fs from "fs";
import crypto from "crypto";

const urls = JSON.parse(fs.readFileSync("pool.json", "utf-8"));

function uuid() {
  return crypto.randomUUID();
}

function isHttp(str) {
  return typeof str === "string" && str.startsWith("http");
}

let rawItems = [];

for (const url of urls) {
  try {
    const res = await fetch(url);
    const data = await res.json();

    if (Array.isArray(data)) {
      rawItems.push(...data);
    } else if (data.sites && Array.isArray(data.sites)) {
      rawItems.push(...data.sites);
    }

    console.log("读取成功:", url);
  } catch (err) {
    console.log("读取失败:", url);
  }
}

let extracted = [];

for (const item of rawItems) {
  let apiUrl = null;

  if (isHttp(item.api)) apiUrl = item.api;
  else if (isHttp(item.baseUrl)) apiUrl = item.baseUrl;
  else if (isHttp(item.ext)) apiUrl = item.ext;
  else if (item.ext && isHttp(item.ext.site)) apiUrl = item.ext.site;

  if (apiUrl && !apiUrl.includes(".jar") && !apiUrl.includes("csp_")) {
    extracted.push({
      name: item.name || item.key || "未知",
      api: apiUrl
    });
  }
}

const unique = new Map();
for (const item of extracted) {
  unique.set(item.api, item);
}

const converted = Array.from(unique.values()).map(item => ({
  id: uuid(),
  key: item.name,
  name: item.name,
  api: item.api,
  type: 2,
  isActive: 1,
  time: new Date().toISOString(),
  isDefault: 0,
  remark: "",
  tags: [],
  priority: 0,
  proxyMode: "none",
  customProxy: ""
}));

fs.writeFileSync(
  "omnibox.json",
  JSON.stringify({ sites: converted }, null, 2)
);

console.log("转换完成，共", converted.length, "条");
