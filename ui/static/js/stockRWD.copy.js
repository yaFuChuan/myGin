window.mUrl='https://survey.bgdrug.com.tw:40011/';

// 全域變數：暫存尚未送出的盤點資料，每筆代表一筆記錄
let tempInventoryData = [];

// 全域變數：儲存從後端取得的貨品清單資料
let productList = [];

// 全域變數：掃描器實例，用於控制掃描功能
let html5QrCode = null;

// 全域變數：記錄掃描器是否正在運作
let isScanning = false;

document.addEventListener("DOMContentLoaded", function() {
  // 取得並隱藏掃描容器（可根據需求調整位置）
  const readerDiv = document.getElementById("reader");
  if (readerDiv) {
    // 此處不固定高度，讓掃描畫面浮動在欄位下，自動調整寬度
    readerDiv.style.display = "none";
    readerDiv.style.width = "100%";
  }
  
  // 從後端取得貨品清單資料
  fetch('/api/products')
    .then(response => response.json())
    .then(data => { productList = data; })
    .catch(error => console.error('Error fetching products:', error));

  // 當使用者點選「國際條碼」欄位時，清除內容並啟動掃描
  const barcodeField = document.getElementById("barcode");
  barcodeField.addEventListener("click", function(e) {
    e.stopPropagation();        // 避免事件冒泡
    barcodeField.value = "";      // 清空先前掃描結果
    startScanning();              // 啟動掃描
  });

  // 如果有啟動掃描按鈕 (id="startScanBtn")，也提供相同功能
  const startScanBtn = document.getElementById("startScanBtn");
  if (startScanBtn) {
    startScanBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      startScanning();
    });
  }

  // 點選頁面其他區域時，停止掃描並隱藏掃描容器
  document.addEventListener("click", function(e) {
    if (e.target.id !== "barcode" && e.target.id !== "startScanBtn") {
      stopScanning();
    }
  });

  // 各表單欄位按 Enter 自動跳轉
  const fields = ["barcode", "productName", "storeCode", "batchNumber", "expiration", "storageCode", "count"];
  fields.forEach((field, index) => {
    document.getElementById(field).addEventListener("keydown", function(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        if (index < fields.length - 1) {
          document.getElementById(fields[index + 1]).focus();
        }
      }
    });
  });

  // 暫存未送出按鈕事件
  document.getElementById("tempSaveBtn").addEventListener("click", function() {
    const inventoryRecord = readFormData();
    tempInventoryData.push(inventoryRecord);
    updateInventoryList();
    resetForm();
  });

  // 送出至 ERP 按鈕事件
  document.getElementById("submitBtn").addEventListener("click", function() {
    fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tempInventoryData)
    })
    .then(response => {
      if (response.ok) {
        alert("盤點資料已成功送出至ERP！");
        tempInventoryData = [];
        updateInventoryList();
      } else {
        alert("送出失敗，請稍後再試！");
      }
    })
    .catch(error => {
      console.error('Error submitting inventory data:', error);
      alert("送出失敗，請檢查網路連線！");
    });
  });
});

/**
 * 停止掃描：若掃描中則停止並隱藏掃描容器，回傳 Promise 以便連鎖後續操作
 */
function stopScanning() {
  if (!isScanning || !html5QrCode) {
    const readerDiv = document.getElementById("reader");
    if (readerDiv) {
      readerDiv.style.display = "none";
    }
    return Promise.resolve();
  }
  return html5QrCode.stop()
    .then(() => {
      console.log("掃描已停止。");
      html5QrCode.clear();
      isScanning = false;
      const readerDiv = document.getElementById("reader");
      if (readerDiv) {
        readerDiv.style.display = "none";
      }
    })
    .catch(err => {
      console.error("停止掃描時發生錯誤：", err);
      isScanning = false;
      const readerDiv = document.getElementById("reader");
      if (readerDiv) {
        readerDiv.style.display = "none";
      }
      return Promise.resolve();
    });
}

/**
 * 啟動掃描：先停止舊的掃描器，再建立新的掃描器並啟動
 */
function startScanning() {
  stopScanning().finally(() => {
    // 顯示掃描容器並使其浮動在欄位下（位置可由 CSS 控制）
    const readerDiv = document.getElementById("reader");
    if (readerDiv) {
      readerDiv.style.display = "block";
    }
    html5QrCode = new Html5Qrcode("reader");
    startScanningWithCamera();
  });
}

/**
 * 嘗試使用後置鏡頭啟動掃描，若失敗則改用前置鏡頭
 * 調整參數以便即使條碼較不清楚也能快速敏捷掃描，並請求自動對焦
 */
function startScanningWithCamera() {
  const configBack = {
    fps: 30, // 提高 fps，使更新更流暢
    qrbox: { width: 300, height: 300 },
    videoConstraints: { 
      facingMode: { exact: "environment" },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      advanced: [{ focusMode: "continuous" }] // 請求連續自動對焦
    },
    experimentalFeatures: {
      useBarCodeDetectorIfSupported: true
    }
  };

  html5QrCode.start(configBack.videoConstraints, configBack, onScanSuccess, onScanError)
    .then(() => {
      isScanning = true;
      console.log("使用後置鏡頭啟動掃描 (高 fps、自動對焦設定)。");
    })
    .catch(err => {
      console.warn("後置鏡頭啟動失敗，改用前置鏡頭。錯誤：", err);
      const configFront = {
        fps: 30,
        qrbox: { width: 300, height: 300 },
        videoConstraints: { 
          facingMode: "user",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          advanced: [{ focusMode: "continuous" }]
        },
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };
      html5QrCode.start(configFront.videoConstraints, configFront, onScanSuccess, onScanError)
        .then(() => {
          isScanning = true;
          console.log("使用前置鏡頭啟動掃描 (高 fps、自動對焦設定)。");
        })
        .catch(err => {
          console.error("前置鏡頭啟動也失敗：", err);
        });
    });
}

/**
 * 掃描成功回調：  
 * 1. 將掃描到的條碼填入「國際條碼」欄位  
 * 2. 根據條碼自動填入其他相關欄位（若資料庫有對應資料）  
 * 3. 成功後停止掃描
 */
function onScanSuccess(decodedText, decodedResult) {
  document.getElementById("barcode").value = decodedText;
  const product = productList.find(item => item.barcode === decodedText);
  if (product) {
    document.getElementById("productName").value = product.name;
    document.getElementById("storageCode").value = product.storageCode;
  }
  stopScanning();
}

/**
 * 掃描錯誤回調：  
 * 若錯誤訊息包含常見提示則忽略，避免重複印出
 */
function onScanError(errorMessage) {
  if (
    errorMessage.indexOf("No barcode or QR code detected") !== -1 ||
    errorMessage.indexOf("No MultiFormat Readers were able to detect the code") !== -1
  ) {
    return;
  }
  console.warn("掃描錯誤：", errorMessage);
}

/**
 * 讀取表單欄位值，回傳一個盤點記錄物件
 */
function readFormData() {
  return {
    barcode: document.getElementById("barcode").value,
    productName: document.getElementById("productName").value,
    storeCode: document.getElementById("storeCode").value,
    batchNumber: document.getElementById("batchNumber").value,
    expiration: document.getElementById("expiration").value,
    storageCode: document.getElementById("storageCode").value,
    count: parseInt(document.getElementById("count").value) || 0
  };
}

/**
 * 更新暫存清單的顯示，每筆記錄以列表呈現
 */
function updateInventoryList() {
  const listElement = document.getElementById("inventoryList");
  listElement.innerHTML = "";
  tempInventoryData.forEach((record, index) => {
    const listItem = document.createElement("li");
    listItem.textContent = `記錄 ${index + 1}: 條碼: ${record.barcode}, 名稱: ${record.productName}, 門店: ${record.storeCode}, 批號: ${record.batchNumber}, 有效日: ${record.expiration}, 儲位: ${record.storageCode}, 數量: ${record.count}`;
    listElement.appendChild(listItem);
  });
}

/**
 * 重置表單，但保留「門店代號」與「儲位代號」，並將焦點設回「國際條碼」欄位
 */
function resetForm() {
  const storeCode = document.getElementById("storeCode").value;
  const storageCode = document.getElementById("storageCode").value;
  document.getElementById("inventoryForm").reset();
  document.getElementById("storeCode").value = storeCode;
  document.getElementById("storageCode").value = storageCode;
  document.getElementById("barcode").focus();
}
