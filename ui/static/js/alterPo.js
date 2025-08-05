"use strict";

//console.log(mUrl+"del/"); 

//------------------------
//location.reload(true);//這會強制瀏覽器忽略快取，重新載入整個頁面

document.getElementById("exePo").addEventListener("click", getContent_toERP); 
let exPo=document.getElementById("exePo");
let delPo = document.createElement('button');
delPo.textContent='刪除本日全部產生採購單';
delPo.id='delPo';
exPo.parentNode.insertBefore(delPo,exPo.nextSibling);
document.getElementById("delPo").addEventListener("click",cmddel);

function cmddel(){
  let myv='';                               
  if (isGDP.value=='只顯示GDP商品'){        
      myv = 'a';                              
  }else{                                    
      myv = 'b';                              
  }                                         

  let isdel = confirm("您確定今日產生採購單全部刪除嗎？");
  if (isdel){
    alert("您確認刪除,執行刪除中喔！");

    fetch(mUrl+"del/",{
      method: 'POST', 
      headers: {
        'Authorization': 'Bearer your_token',
        'delMsg': 'delpo_today', 
        'CustomHeader': myv,  
      }
    })
    .then(response => {
      console.log(response.headers.get('Content-Type')); 
      console.log(response.headers.get('X-Custom-Header'));
      return response.json();
    })
    .then(data=>{
      alert(data.message);
      alert("已刪除，可以結束了");
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
  }else{
    alert("您點擊了取消,您本次不會刪除採購單喔！");
  }
}

function getContent_toERP(){
  let headData = Array.from(document.querySelectorAll('thead > tr > th')).map(n=>n.innerText)
  //console.log('headData', headData )

  let tableObject = [];
  for(let trNode of document.querySelectorAll('tbody > tr') ){
      let data = {};
      Array.from(trNode.querySelectorAll('td')).forEach((n , index)=>{
            data[ headData[index] ] = n.innerText
          })
      tableObject.push(data)
  }

  //console.log( 'tableObject ',tableObject );
  //console.log(tableObject.length);

  let result = confirm("您本次資料<將>送ERP產生採購單,確定要執行此操作嗎？");
  if (result) {
    fetch(mUrl,{
      method: 'POST',
      body: JSON.stringify(tableObject),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      }
    })
    .then(function(data){
      alert("回傳值data已成功創建:",data);
    })
    .then(function(response) {
      //alert("回傳值:",response);
    })
    .catch(error => console.error('Error:', error)); 

    tableObject=null;
    alert("已經在ERP建立批次採購單，勿重覆按第這下送出，因有其他ERP操作系統，請耐心等待1~3分鐘後回傳『成功字樣』，將關閉頁面，謝謝");
  }else{
    alert("您點擊了取消,您本次資料不送ERP採購單喔！");
  }
}
