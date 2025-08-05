window.sales2023='http://localhost:4000/sales2023/';

//setTimeout(passFunc,1000);
function passFunc(){
  let passCode=prompt("觀看財務資料，請輸入英文大小寫+數字複雜度通行碼:");

  fetch(sales2023,{
    method: 'GET',
    headers: {
      'Authorization': 'Bearer your_token',
      'Accept': 'application/json',
      'passCode': passCode,
    }
  })
  .then(response => response.json())
  .then((data)=>{
    console.log('data is :',data);
  })
  .catch(error => {
    console.error('Error fetching data:', error);
  });
}
