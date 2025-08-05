window.adsUrl='http://survey.bgdrug.com.tw:40011/inv/';
//window.adsUrl='https://localhost:4001/inv/';
//window.adsUrl='http://192.168.0.190:4000/inv/';
//window.adsUrl='http://192.168.1.110:4000/inv/';
//window.adsUrl='http://localhost:4000/inv/'; 

// 取得要插入表格的元素 (例如 body)
const tableContainer = document.getElementById('tableContainer');
// 建立表格
const table = document.createElement('table');
// Assign an ID to the table
table.id = 'inv_Tur';
// 建立表頭
const thead = document.createElement('thead');
const headerRow = document.createElement('tr');
const headers = ['品牌代號','品牌','銷售金額','期初存貨','期末存貨','平均存貨','銷貨成本','存貨週轉次數','週轉天數']; 

headers.forEach(headerText => {
  const th = document.createElement('th');
  th.textContent = headerText;
  headerRow.appendChild(th);
  th.style.textAlign = 'right';
});
thead.appendChild(headerRow);
table.appendChild(thead);

const tbody = document.createElement('tbody');
document.getElementById("getdata").addEventListener("click", getERP);

function getERP(){
  console.log("清單所選值",select.value);
  console.log("cate所選值",cate.value);

  tbody.innerHTML = '';
  let start_date=document.getElementById("startDate").value;
  let end_date=document.getElementById("endDate").value;
  console.log("start_date",start_date,end_date);


fetch(adsUrl,{
  method: 'GET',
  headers: {
    'Authorization': 'Bearer your_token',
    'Accept': 'application/json',
    'd1':start_date,
    'd2':end_date,
    'db':select.value,
    'cate':cate.value,
  }
})
.then(response => response.json())
.then((data)=>{
  console.log("data",typeof data,data);

  data.forEach(item=>{
    const row = document.createElement('tr');
    for (const key in item) {
      const cell = document.createElement('td');
      cell.textContent = item[key];
      row.appendChild(cell);
    }
    tbody.appendChild(row);

  });
  table.appendChild(tbody);
  tableContainer.appendChild(table);

  //css 
  const inv = document.getElementById('inv_Tur');
  inv.style.width = '90%';
  inv.style.margin = '10px auto';
  inv.style.textAlign = 'right';
  headerRow.cells[0].style.width = '50px';
  headerRow.cells[1].style.width = '100px';
  headerRow.cells[2].style.width = '100px';
  headerRow.cells[3].style.width = '100px';
  headerRow.cells[4].style.width = '100px';
  headerRow.cells[5].style.width = '80px';
  headerRow.cells[6].style.width = '60px';
  headerRow.cells[7].style.width = '50px';
  headerRow.cells[8].style.width = '50px';

  const h2Element = document.querySelector('h2');

  h2Element.style.textAlign = 'center'; // 置中
  h2Element.style.color = 'blue'; // 顏色設定為藍色

  //format convert excel error
  //const columnsToFormat = [2, 3, 4, 5];
  //formatSpecificColumns('inv_Tur', columnsToFormat);

  //遍歷每一行，為每個 td 元素添加 hover 事件

  formatNumbers();    
  setTimeout(sortEven,1000);
})
.catch(error => {
  console.error('Error fetching data:', error);
});
}

function sortEven(){
    //sort thead
  let isAscending 
    document.querySelectorAll("#inv_Tur thead th").forEach(th => {
      th.addEventListener("click", function(event) {
        let fi = event.target.cellIndex;
        isAscending = th.dataset.sortOrder !== "asc"; // 切換升序或降序
        th.dataset.sortOrder = isAscending ? "asc" : "desc";
        sortTable(fi); });
    });

    function sortTable(columnIndex) {
      const table = document.getElementById('inv_Tur');
      const tbody = table.querySelector('tbody');
      const rows = Array.from(tbody.children);
      // 虛擬 DOM
      const newRows = rows.slice().sort((a, b) => {
        
        //const cellA = a.cells[columnIndex].textContent || 0;
        //const cellB = b.cells[columnIndex].textContent || 0;
        const cellA = parseFloat(a.cells[columnIndex].textContent) || 0; // 解析為數值
        const cellB = parseFloat(b.cells[columnIndex].textContent) || 0;
        // ... 排序邏輯 ...
        //return cellB.localeCompare(cellA); // 依照 Unicode 順序排序
        return isAscending ? cellA - cellB : cellB - cellA; // 升序或降序
        
      });
      // 創建 DocumentFragment
      const fragment = document.createDocumentFragment();
      newRows.forEach(row => fragment.appendChild(row));
      // 一次性更新 DOM
      tbody.innerHTML = '';
      tbody.appendChild(fragment);
    }
}

function formatNumbers() {
  const cells = document.querySelectorAll("td");
  cells.forEach(cell => {
    const originalValue = parseFloat(cell.textContent);
    if (!isNaN(originalValue)) {
      cell.textContent = originalValue.toLocaleString();
      cell.style.textAlign = 'right';
    }
  });
}
//formatNumbers();

function formatNumberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatSpecificColumns(tableId, columnIndexes) {
  const table = document.getElementById(tableId);
  const rows = table.querySelectorAll('tr');

  rows.forEach((row,index) => {
    if (index > 0){
      columnIndexes.forEach(index => {
         const cell = row.cells[index];
         const number = Number(cell.textContent);
         cell.textContent = formatNumberWithCommas(number);
      });
    }
  });
}

const toExcBefore = document.getElementById("endDate");

const select = document.createElement("select");
select.id = "menu"; 
const option1 = document.createElement("option");
option1.value = "lianqiao";
option1.textContent = "聯橋";
const option2 = document.createElement("option");
option2.value = "tianmu";
option2.textContent = "天幕";
select.appendChild(option1);
select.appendChild(option2);

const cate = document.createElement("select"); 
cate.id="cate";
const opt1 = document.createElement("option"); 
opt1.value = "brand";
opt1.textContent = "品牌";
const opt2 = document.createElement("option");
opt2.value = "descr";
opt2.textContent = "大分類";
cate.appendChild(opt1);
cate.appendChild(opt2);
const opt3 = document.createElement("option"); 
opt3.value = "dep";
opt3.textContent = "部門";
cate.appendChild(opt3); 


insertAfter(select,toExcBefore);
insertAfter(cate,select); 
//export csv
const exportXls = document.createElement('button');
exportXls.id='expXls';
exportXls.textContent = "轉出Excel";
exportXls.addEventListener('click',()=>{
  exportToExcel('inv_Tur');
});

insertAfter(exportXls,select);
function insertAfter(newNode, referenceNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function exportToExcel(tableId) {
  const table = document.getElementById(tableId);
  let csv = '';
  for (let i = 0; i < table.rows[0].cells.length; i++) {
    csv += table.rows[0].cells[i].textContent + ',';
  }
  csv = csv.slice(0, -1) + '\n';
  for (let i = 1; i < table.rows.length; i++) {
    for (let j = 0; j < table.rows[i].cells.length; j++) {
      //csv += table.rows[i].cells[j].textContent + ',';
      let cellText = table.rows[i].cells[j].textContent;
      if (!isNaN(cellText.replace(/,/g, ''))) {
        cellText = cellText.replace(/,/g, '');
      }
      csv += cellText + ',';
    }
    csv = csv.slice(0, -1) + '\n';
  }
  const csvDataWithBom = "\ufeff" + csv;
  const link = document.createElement('a');
  link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvDataWithBom);
  link.download = 'PO_auto.csv';
  link.click();
}
