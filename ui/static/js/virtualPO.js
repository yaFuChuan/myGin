//window.mUrl='http://192.168.0.190:4000/PO/';
window.mUrl='http://survey.bgdrug.com.tw:40011/PO/';
//window.mUrl='http://localhost:4001/PO/';
//console.log(mUrl);

document.querySelectorAll("#myTable thead th").forEach(th => {
  th.addEventListener("click", function(event) {
    let fi = event.target.cellIndex;
    sortTable(fi); });
});

function sortTable(columnIndex) {
  const table = document.getElementById('myTable');
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.children);
  // 虛擬 DOM
  const newRows = rows.slice().sort((a, b) => {
    const cellA = a.cells[columnIndex].textContent;
    const cellB = b.cells[columnIndex].textContent;
    // ... 排序邏輯 ...
    return cellA.localeCompare(cellB); // 依照 Unicode 順序排序
  });
  // 創建 DocumentFragment
  const fragment = document.createDocumentFragment();
  newRows.forEach(row => fragment.appendChild(row));
  // 一次性更新 DOM
  tbody.innerHTML = '';
  tbody.appendChild(fragment);
}

function compareBy(propertyName) { 
  return function (a, b) {
    let x = a[propertyName], y = b[propertyName];
    if (x > y) {
      return -1;  
    }else if (x < y) {   
      return -1; 
    }else{
      return 0;
    }
  };
}

document.getElementById("getData").addEventListener("click", getOrigi);
document.getElementById("display").addEventListener("click", display); 

const vendor1 = document.createElement('label');
const input_v1 = document.createElement('input');
vendor1.for = 'vendor1';
input_v1.type = 'text';
input_v1.id = 'vendor1';
input_v1.placeholder = '請輸入廠商代號';
vendor1.textContent = '廠商起：';
let vLocation=document.getElementById("display");
insertAfter(vendor1,vLocation);
insertAfter(input_v1,vendor1); 

const vendor2 = document.createElement('label');      
const input_v2 = document.createElement('input');     
vendor2.for = 'vendor2';                              
input_v2.type = 'text';                               
input_v2.id = 'vendor2';                              
input_v2.placeholder = '請輸入廠商代號';              
vendor2.textContent = '~ 廠商訖：';                     
insertAfter(vendor2,input_v1); 
insertAfter(input_v2,vendor2); 

let clearGDP =document.createElement("button"); 
let isGDP = document.getElementById("supolier"); 
clearGDP.addEventListener("click", ()=> {
  window.location.replace(window.location.href);
});

function insertAfter(newNode, referenceNode) { 
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling); 
}
  clearGDP.textContent = "清除所選值";  
  insertAfter(clearGDP,isGDP);

function getOrigi(){ 
  let myv='';
  if (isGDP.value=='只顯示GDP商品'){
    myv = 'a';
  }else{
    myv = 'b';
  }
  //console.log("isGDP value is :",isGDP);
  //console.log("input_v1 :",input_v1.value,"input_v2 :",input_v2.value);

  const tableBody = document.getElementById('myTable').getElementsByTagName('tbody')[0]; 
  while (tableBody.firstChild) {
    tableBody.removeChild(tableBody.firstChild);
  }

  //const supplier= document.getElementById("supolier");  
  const searchTerm =' 0123456789';//supplier.value ;

  const options = {
    //keys: ['Supplier_n', 'PrdName']
    keys: ['PrdNo']
  };

  fetch(mUrl,{
    method: 'GET',
    headers: {
      'Authorization': 'Bearer your_token',
      'Accept': 'application/json',
      'CustomHeader': myv,
      'vendor1':input_v1.value,
      'vendor2':input_v2.value,
    }
  })
  .then(response => response.json())
  .then((data)=>{
    /*
    const fuse = new Fuse(data, options);
    filteredFruits = fuse.search(searchTerm);
    */
    //console.log("filteredFruits",typeof filteredFruits,filteredFruits);  
    //console.log("fuse",typeof fuse,fuse);
    console.log("data",typeof data,data);
    /*
      data.forEach(item=>{
        if (item.PrdNo=='07743949'){
          console.log("key",item);
        }
      });
    */
    
    //filteredFruits.forEach(fruit => {
    data.forEach(fruit => { 
      const row         = document.createElement('tr');

      const Supplier    = document.createElement('td');
      const Supplier_n  = document.createElement('td');
      const PrdName     = document.createElement('td');
      const PrdNo       = document.createElement('td');
      const Qty         = document.createElement('td');
      const Stock       = document.createElement('td');
      const JhQty       = document.createElement('td');
      const JhPO        = document.createElement('td');
      const Qpercent    = document.createElement('td');
      const Samt        = document.createElement('td');
      const Spercent    = document.createElement('td');
      const S_ADS       = document.createElement('td');
      const Level       = document.createElement('td');  
      const Safe_Qty    = document.createElement('td');  
      const Max_Qty     = document.createElement('td');  
      const Purchase    = document.createElement('td');  
      const OnWay       = document.createElement('td');
      const QtySQ       = document.createElement('td');
      const AvgM        = document.createElement('td');

      //textContent
      /*
      Supplier.textContent   =fruit.item.Supplier   ;   
      Supplier_n.textContent =fruit.item.Supplier_n ;
      PrdName.textContent    =fruit.item.PrdName    ;
      PrdNo.textContent      =fruit.item.PrdNo      ;
      Qty.textContent        =fruit.item.Qty        ;
      Stock.textContent      =fruit.item.Stock      ;
      Qpercent.textContent   =(fruit.item.Qpercent*1000).toFixed(2)   ;
      Samt.textContent       =fruit.item.Samt       ;
      Spercent.textContent   =(fruit.item.Spercent*1000).toFixed(2)   ;
      S_ADS.textContent      =fruit.item.S_ADS      ;
      Level.textContent      =fruit.item.Level      ;
      Safe_Qty.textContent   =fruit.item.Safe_Qty.toFixed(2)   ;
      Max_Qty.textContent    =fruit.item.Max_Qty.toFixed(2)    ;
      Purchase.textContent   =fruit.item.Purchase.toFixed(0)   ;
      OnWay.textContent      =fruit.item.OnWay.toFixed(0)   ;
      QtySQ.textContent      =fruit.item.QtySQ.toFixed(0)   ; 
      AvgM.textContent       =fruit.item.AvgM.toFixed(2)   ;  
      */
      Supplier.textContent   =fruit.Supplier   ;                     
      Supplier_n.textContent =fruit.Supplier_n ;                     
      PrdName.textContent    =fruit.PrdName    ;                     
      PrdNo.textContent      =fruit.PrdNo      ;                     
      Qty.textContent        =fruit.Qty        ;                     
      Stock.textContent      =fruit.Stock      ;                     
      JhQty.textContent      =fruit.JhQty      ;
      JhPO.textContent      =fruit.JhPO       ;
      Qpercent.textContent   =(fruit.Qpercent*1).toFixed(9)   ;   
      Samt.textContent       =fruit.Samt       ;                     
      Spercent.textContent   =(fruit.Spercent*1).toFixed(9)   ;   
      S_ADS.textContent      =fruit.S_ADS.toFixed(4)      ;                     
      Level.textContent      =fruit.Level      ;                     
      Safe_Qty.textContent   =fruit.Safe_Qty.toFixed(2)   ;          
      Max_Qty.textContent    =fruit.Max_Qty.toFixed(2)    ;          
      Purchase.textContent   =fruit.Purchase.toFixed(0)   ;          
      OnWay.textContent      =fruit.OnWay.toFixed(0)   ;             
      QtySQ.textContent      =fruit.QtySQ.toFixed(0)   ;             
      AvgM.textContent       =fruit.AvgM.toFixed(2)   ;              

      row.appendChild(Supplier  );
      row.appendChild(Supplier_n);
      row.appendChild(PrdName   );
      row.appendChild(PrdNo     ); 
      row.appendChild(Qty       ); 
      row.appendChild(Stock     ); 
      row.appendChild(JhQty     );
      row.appendChild(JhPO      );
      row.appendChild(Qpercent  ); 
      row.appendChild(Samt      ); 
      row.appendChild(Spercent  ); 
      row.appendChild(S_ADS     ); 
      row.appendChild(Level     ); 
      row.appendChild(Safe_Qty  ); 
      row.appendChild(Max_Qty   ); 
      row.appendChild(Purchase  ); 
      row.appendChild(OnWay  ); 
      row.appendChild(QtySQ  ); 
      row.appendChild(AvgM   );

      tableBody.appendChild(row);
    });
  })
  .catch(error => {
    console.error('Error fetching data:', error);
  });
  //const tableBody = document.getElementById('myTable').getElementsByTagName('tbody')[0];
  setTimeout(alterStyle,10000);
}

function display(){
  //moneyElement.style.textAlign = 'right';
  const table = document.getElementById('myTable');
  const rows = table.querySelectorAll('tr');
  //console.log("rows",rows);
  rows.forEach(row => {
      row.cells[15].style.textAlign = 'right'; // cells屬性可以直接獲取td集合，索引從0開始
      row.cells[15].style.color = 'blue';
      row.cells[14].style.textAlign = 'right';
      row.cells[13].style.textAlign = 'right';
  }); 

  rows.forEach(item => {
    //console.log("item 您點擊了這個 td！:",item.cells[13].innerText);
    item.cells[15].addEventListener('click', (e) => {
      let alter =prompt("請修改數字_接受0～萬數字",item.cells[15].textContent);
        if (alter == null || alter == ''){
          item.cells[15].textContent=0;
        }else{
          item.cells[15].textContent=alter;
        }
    });
    
  });
}

const myDiv = document.querySelector('.p-2');
const exportXls = document.createElement('button');
exportXls.id='expXls';
exportXls.textContent = "轉出Excel";
exportXls.addEventListener('click',()=>{
  exportToExcel('myTable');
});
myDiv.insertBefore(exportXls,myDiv[0]);

const expXls = document.getElementById('expXls');
const onway_alterQty =document.createElement('button');
onway_alterQty.textContent = '有在途量=>實量改零';
expXls.insertAdjacentElement('afterend',onway_alterQty);
onway_alterQty.style.margin = '5px 10px';
onway_alterQty.addEventListener('click',()=>{
  altActuralQty();
});

function altActuralQty(){
  const myTable = document.getElementById('myTable');
  const thead = myTable.querySelector('thead');
  const targetColumnName = "在途量";

  let targetColumnIndex = -1;
  thead.querySelectorAll('th').forEach((th, index) => {
    if (th.textContent === targetColumnName) {
      targetColumnIndex = index;
    }
  });

  if (targetColumnIndex !== -1) {
    const tbody = myTable.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');
    //console.log(rows);
    rows.forEach(row => {
      const targetCell = row.cells[targetColumnIndex];
      const targetCellValue = targetCell.textContent;
      if (targetCellValue>0){
        const actualQtyCell = row.cells[targetColumnIndex-1];
        actualQtyCell.style.backgroundColor="yellow";
        actualQtyCell.textContent=0;
      }
      //console.log("row cell:",targetCell,targetCellValue);
    });
  }else{
    console.error('找不到指定欄位');
  }
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
      csv += table.rows[i].cells[j].textContent + ',';
    }
    csv = csv.slice(0, -1) + '\n';
  }
  const csvDataWithBom = "\ufeff" + csv;
  const link = document.createElement('a');
  link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvDataWithBom);
  link.download = 'PO_auto.csv';
  link.click();
}

function alterStyle(){
  const table = document.getElementById('myTable');//td:nth-child(3),
  const thirdColumnCells = table.querySelectorAll('tbody tr td:nth-child(3),td:nth-child(2),td:nth-child(9),td:nth-child(11)');
  thirdColumnCells.forEach(cell => {
    /*
    cell.style.fontSize = '10px';
    cell.style.width='10px';
    cell.style.whiteSpace = 'pre-wrap'; 
    */
    cell.style.backgroundColor = '#f5f5dc';      
    
    cell.style.width = 'auto';
    cell.style.whiteSpace = 'normal';
    cell.style.wordBreak = 'break-word'; 
    cell.style.padding = '5px';
    
    
  });


  const thead = document.querySelector('#myTable thead');
  thead.querySelectorAll('th').forEach((th, index) => {
    if (index === 2) { // 第三欄
      th.style.width = 'auto'; // 或者設定為更合理的固定寬度如 '150px'
      th.style.whiteSpace = 'normal';
      th.style.wordBreak = 'break-word';
      th.style.padding = '5px';
    }
  });
}

function alterQty(e){
  let alter =prompt("修改數字",e.textContent);
  e.textContent=alter;
}
