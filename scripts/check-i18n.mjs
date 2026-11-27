import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = path.resolve("src");
const files = [];
const allowed = new Set(["&nbsp;", "App Store", "Google Play", "MM/YY", "WhatsApp :", "Email :", "GIFT-XXXXXXXXXX or DWGC:GIFT-XXXXXXXXXX", "concierge@editorialtrust.sys", "+1 (800) TRUST-SYS", "Arthur P. Vance", "McDonald\'s Header", "McDonald\'s® (Paris Hotel De Ville)", "0.7 km"]);
const attrs = new Set(["alt", "aria-description", "aria-label", "label", "placeholder", "title"]);
const visibleCall = /^(?:alert|confirm|prompt|toast(?:\.(?:error|info|success|warning))?)$/;

function walk(directory) { for (const entry of fs.readdirSync(directory, {withFileTypes:true})) { const file=path.join(directory,entry.name); if(entry.isDirectory()) walk(file); else if(/\.(?:ts|tsx)$/.test(entry.name) && !/\.(?:test|spec)\.(?:ts|tsx)$/.test(entry.name)) files.push(file); } }
walk(ROOT);
const findings=[];
const visible=(value)=>{const text=value.replace(/\s+/g," ").trim(); return /[A-Za-zÄÖÜäöüß]{2}/.test(text) && !allowed.has(text) && !/^([a-z]+[-_./:]?)+$/.test(text) && !/^(?:Bearer|Content-Type|DELETE|GET|PATCH|POST|PUT|application\/json|use client)$/.test(text);};

for (const file of files) {
 const body=fs.readFileSync(file,"utf8"); const source=ts.createSourceFile(file,body,ts.ScriptTarget.Latest,true,file.endsWith(".tsx")?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 const report=(node,kind,value)=>{const text=value.replace(/\s+/g," ").trim(); if(!visible(text)) return; const pos=source.getLineAndCharacterOfPosition(node.getStart(source)); findings.push(`${path.relative(process.cwd(),file)}:${pos.line+1}:${pos.character+1} [${kind}] ${JSON.stringify(text)}`);};
 const visit=(node)=>{
  if(ts.isJsxText(node)) report(node,"jsx",node.text);
  if(ts.isJsxAttribute(node)&&attrs.has(node.name.text)){const i=node.initializer;if(i&&ts.isStringLiteral(i))report(node,"attribute",i.text);if(i&&ts.isJsxExpression(i)&&i.expression&&(ts.isStringLiteral(i.expression)||ts.isNoSubstitutionTemplateLiteral(i.expression)))report(node,"attribute",i.expression.text);}
  if(ts.isCallExpression(node)){const c=node.expression.getText(source),a=node.arguments[0];if(visibleCall.test(c)&&a){if(ts.isStringLiteral(a)||ts.isNoSubstitutionTemplateLiteral(a))report(a,c,a.text);else if(ts.isTemplateExpression(a))report(a,c,a.getText(source));}}
  ts.forEachChild(node,visit);
 }; visit(source);
}
if(findings.length){console.error("Hardcoded user-visible text must use next-intl:\n"+findings.join("\n"));process.exit(1);} console.log(`i18n UI scan passed (${files.length} source files)`);
