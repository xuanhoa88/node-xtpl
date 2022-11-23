# xtpl
A node module to generate .xlsx files from a .xlsx template.

## How it works

When xtpl reads a xlsx file, it creates a tree for each worksheet.  
And, each tree is translated to a nunjucks(jinja2) template with custom tags.  
When the template is rendered, nunjucks extensions of cumtom tags call corresponding tree nodes to write the xlsx file.

## How to install

```shell
npm install xtpl
```

## How to use

*   To use xtpl, you need to be familiar with the [syntax of nunjucks template](https://mozilla.github.io/nunjucks/templating.html).
*   Get a pre-written xls/x file as the template.
*   Insert variables in the cells, such as : 

```jinja2
{{name}}
```

*   Insert control statements in the cells :

```jinja2
{%- for row in rows %}
{% set outer_loop = loop %}{% for row in rows %}
Cell text
{{outer_loop.index}}{{loop.index}}
{%+ endfor%}{%+ endfor%}
```

*   Run the code
```javascript
const XTPL = require('xtpl');
async function run() {
    const xtpl = new XTPL();
    await xtpl.readFile('template.xlsx');
    const payloads = await getPayloads();
    xtpl.renderSheets(payloads);
    await xtpl.writeFile('result.xlsx');
}
run();
```

## Supported
* MergedCell   
* Non-string value for a cell (use **{{variable}}** with no leading  or trailing spaces or **{%xv variable%}** to specify a variable) 
* Image (use **{%img variable%}**)  
* DataValidation   
* AutoFilter


## Related

* [exceljs](https://github.com/exceljs/exceljs)
* [nunjucks](https://mozilla.github.io/nunjucks/)

